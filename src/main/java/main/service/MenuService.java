package main.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.domain.Menu;
import main.domain.PiattoDelGiorno;
import main.repository.MenuRepository;
import main.repository.PiattoDelGiornoRepository;
import main.security.SecurityUtils;
import main.service.dto.AllergeneDTO;
import main.service.dto.ImmagineMenuDTO;
import main.service.dto.ListaContattiDTO;
import main.service.dto.MenuCompletoDTO;
import main.service.dto.MenuDTO;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.dto.PortataConProdottiDTO;
import main.service.dto.ProdottoDTO;
import main.service.mapper.MenuMapper;
import main.service.mapper.PiattoDelGiornoMapper;
import main.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link main.domain.Menu}.
 */
@Service
@Transactional
public class MenuService {

    private static final Logger LOG = LoggerFactory.getLogger(MenuService.class);

    private final MenuRepository menuRepository;
    private final MenuMapper menuMapper;
    private final PiattoDelGiornoMapper piattoDelGiornoMapper;
    private final PiattoDelGiornoRepository piattoDelGiornoRepository;
    private final PortataService portataService;
    private final ProdottoService prodottoService;
    private final ImmagineMenuService immagineMenuService;
    private final AllergeneService allergeneService;
    private final ListaContattiService listaContattiService;

    public MenuService(
        MenuRepository menuRepository,
        MenuMapper menuMapper,
        PiattoDelGiornoMapper piattoDelGiornoMapper,
        PiattoDelGiornoRepository piattoDelGiornoRepository,
        PortataService portataService,
        ProdottoService prodottoService,
        ImmagineMenuService immagineMenuService,
        AllergeneService allergeneService,
        ListaContattiService listaContattiService
    ) {
        this.menuRepository = menuRepository;
        this.menuMapper = menuMapper;
        this.piattoDelGiornoMapper = piattoDelGiornoMapper;
        this.piattoDelGiornoRepository = piattoDelGiornoRepository;
        this.portataService = portataService;
        this.prodottoService = prodottoService;
        this.immagineMenuService = immagineMenuService;
        this.allergeneService = allergeneService;
        this.listaContattiService = listaContattiService;
    }

    /**
     * Save a menu.
     */

    /**
     * Update a menu.
     */
    public MenuDTO save(MenuDTO menuDTO) {
        LOG.debug("Request to save Menu : {}", menuDTO);
        return persistMenu(menuDTO);
    }

    public MenuDTO update(MenuDTO menuDTO) {
        LOG.debug("Request to update Menu : {}", menuDTO);
        checkOwnership(menuDTO.getId());
        return persistMenu(menuDTO);
    }

    // OPT-10: metodo privato condiviso — evita duplicazione tra save() e update()
    private MenuDTO persistMenu(MenuDTO dto) {
        Menu menu = menuMapper.toEntity(dto);
        return menuMapper.toDto(menuRepository.save(menu));
    }

    /**
     * Partially update a menu.
     */
    public Optional<MenuDTO> partialUpdate(MenuDTO menuDTO) {
        LOG.debug("Request to partially update Menu : {}", menuDTO);
        checkOwnership(menuDTO.getId());
        return menuRepository
            .findById(menuDTO.getId())
            .map(existingMenu -> {
                menuMapper.partialUpdate(existingMenu, menuDTO);
                return existingMenu;
            })
            .map(menuRepository::save)
            .map(menuMapper::toDto);
    }

    /**
     * Get all the menus (admin use — nessun filtro ownership).
     */
    @Transactional(readOnly = true)
    public List<MenuDTO> findAll() {
        LOG.debug("Request to get all Menus");
        return menuRepository.findAll().stream().map(menuMapper::toDto).toList();
    }

    /**
     * Get only the menus belonging to the currently authenticated user.
     */
    @Transactional(readOnly = true)
    public List<MenuDTO> findAllByCurrentUser() {
        LOG.debug("Request to get Menus for current user");
        return menuRepository.findByRistoratoreIsCurrentUser().stream().map(menuMapper::toDto).toList();
    }

    /**
     * Verifica che il menu con l'id dato appartenga all'utente corrente.
     * Lancia BadRequestAlertException se il menu non esiste o appartiene ad un altro utente.
     */
    private void checkOwnership(UUID id) {
        String currentLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new BadRequestAlertException("Utente non autenticato", "menu", "unauthenticated"));
        Menu menu = menuRepository.findById(id).orElseThrow(() -> new BadRequestAlertException("Menu non trovato", "menu", "idnotfound"));
        if (menu.getRistoratore() == null || !menu.getRistoratore().getLogin().equals(currentLogin)) {
            throw new BadRequestAlertException("Accesso negato", "menu", "forbidden");
        }
    }

    public Page<MenuDTO> findAllWithEagerRelationships(Pageable pageable) {
        return menuRepository.findAllWithEagerRelationships(pageable).map(menuMapper::toDto);
    }

    /**
     * Get one menu by id.
     */
    @Transactional(readOnly = true)
    public Optional<MenuDTO> findOne(UUID id) {
        LOG.debug("Request to get Menu : {}", id);
        return menuRepository.findOneWithEagerRelationships(id).map(menuMapper::toDto);
    }

    /**
     * Delete the menu by id.
     */
    public void delete(UUID id) {
        LOG.debug("Request to delete Menu : {}", id);
        checkOwnership(id);
        piattoDelGiornoRepository.deleteByMenuId(id);
        piattoDelGiornoRepository.flush();
        menuRepository.deleteById(id);
    }

    /**
     * Restituisce i piatti del giorno ATTIVI per un menu con allergenis popolati.
     *
     * Pattern a 3 query nella stessa transazione:
     *
     * Query 1 (findPiattiDelGiornoAttiviByMenuId): piatti attivi + prodotto
     * Query 2 (findPiattiDelGiornoAttiviByMenuIdConAllergeniProdotto): + prodotto.allergenis
     * Query 3 (findPiattiDelGiornoAttiviByMenuIdConAllergeniDiretti): + p.allergenis diretti
     *
     * Hibernate 1st-level cache garantisce che le query lavorino sulle stesse
     * istanze. Le collection vengono inizializzate in memoria prima della
     * serializzazione del mapper → icone allergeni correttamente incluse nella risposta.
     */
    @Transactional(readOnly = true)
    public List<PiattoDelGiornoDTO> findPiattiDelGiornoAttiviByMenuId(UUID menuId) {
        LOG.debug("Request to get active PiattiDelGiorno with allergenis for Menu : {}", menuId);

        // Query 1: piatti attivi + prodotto
        List<PiattoDelGiorno> baseList = menuRepository.findPiattiDelGiornoAttiviByMenuId(menuId);

        // Query 2: inizializza prodotto.allergenis sulle stesse istanze
        menuRepository.findPiattiDelGiornoAttiviByMenuIdConAllergeniProdotto(menuId);

        // Query 3: inizializza p.allergenis (piatti personalizzati) sulle stesse istanze
        menuRepository.findPiattiDelGiornoAttiviByMenuIdConAllergeniDiretti(menuId);

        return baseList.stream().map(piattoDelGiornoMapper::toDto).toList();
    }

    /**
     * Carica tutto il necessario per la vista pubblica in un'unica transazione.
     * Sostituisce le N+6 chiamate HTTP separate con una sola: GET /api/public/menus/{id}/full
     *
     * Flusso interno (tutto nello stesso thread, stessa connessione DB):
     *  1. Carica il menu (se non esiste → Optional.empty() → 404)
     *  2. Carica portate + prodotti per portata
     *  3. Carica piatti del giorno attivi con allergeni
     *  4. Carica immagini, allergeni, contatti
     *
     * @param id UUID del menu pubblico
     * @return Optional con il DTO aggregato, vuoto se il menu non esiste
     */
    @Transactional(readOnly = true)
    public Optional<MenuCompletoDTO> findMenuCompleto(UUID id) {
        LOG.debug("Request to get MenuCompleto (aggregato) : {}", id);

        // Se il menu non esiste restituiamo subito empty → il controller risponde 404
        Optional<MenuDTO> menuOpt = menuRepository.findOneWithEagerRelationships(id).map(menuMapper::toDto);
        if (menuOpt.isEmpty()) {
            return Optional.empty();
        }
        MenuDTO menu = menuOpt.get();

        // Portate con prodotti annidati
        List<PortataConProdottiDTO> portateConProdotti = portataService
            .findByMenuId(id)
            .stream()
            .map(portata -> {
                List<ProdottoDTO> prodotti = prodottoService.findByPortataId(portata.getId());
                return new PortataConProdottiDTO(
                    portata.getId(),
                    portata.getTipo(),
                    portata.getNomeDefault(),
                    portata.getNomePersonalizzato(),
                    prodotti
                );
            })
            .toList();

        // Piatti del giorno attivi (già con allergeni — vedi findPiattiDelGiornoAttiviByMenuId)
        List<PiattoDelGiornoDTO> piattiDelGiorno = findPiattiDelGiornoAttiviByMenuId(id);

        // Immagini, allergeni, contatti
        List<ImmagineMenuDTO> immagini = immagineMenuService.findByMenuId(id);
        List<AllergeneDTO> allergeni = allergeneService.findAll();
        List<ListaContattiDTO> contatti = listaContattiService.findByMenuId(id);

        return Optional.of(new MenuCompletoDTO(menu, portateConProdotti, piattiDelGiorno, immagini, allergeni, contatti));
    }
}
