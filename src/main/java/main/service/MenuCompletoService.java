package main.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.PiattoDelGiorno;
import main.repository.MenuRepository;
import main.service.dto.AllergeneDTO;
import main.service.dto.ImmagineMenuMetaDTO;
import main.service.dto.ListaContattiDTO;
import main.service.dto.MenuCompletoDTO;
import main.service.dto.MenuDTO;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.dto.PortataConProdottiDTO;
import main.service.dto.ProdottoDTO;
import main.service.mapper.MenuMapper;
import main.service.mapper.PiattoDelGiornoMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsabile dell'assemblaggio dei DTO aggregati per il menu.
 *
 * Estratto da MenuService per rispettare il Single Responsibility Principle:
 * MenuService gestisce il CRUD del menu,
 * MenuCompletoService assembla le viste aggregate (pubblica e piatti attivi).
 */
@Service
@Transactional(readOnly = true)
public class MenuCompletoService {

    private static final Logger LOG = LoggerFactory.getLogger(MenuCompletoService.class);

    private final MenuRepository menuRepository;
    private final MenuMapper menuMapper;
    private final PiattoDelGiornoMapper piattoDelGiornoMapper;
    private final PortataService portataService;
    private final ProdottoService prodottoService;
    private final ImmagineMenuService immagineMenuService;
    private final AllergeneService allergeneService;
    private final ListaContattiService listaContattiService;

    public MenuCompletoService(
        MenuRepository menuRepository,
        MenuMapper menuMapper,
        PiattoDelGiornoMapper piattoDelGiornoMapper,
        PortataService portataService,
        ProdottoService prodottoService,
        ImmagineMenuService immagineMenuService,
        AllergeneService allergeneService,
        ListaContattiService listaContattiService
    ) {
        this.menuRepository = menuRepository;
        this.menuMapper = menuMapper;
        this.piattoDelGiornoMapper = piattoDelGiornoMapper;
        this.portataService = portataService;
        this.prodottoService = prodottoService;
        this.immagineMenuService = immagineMenuService;
        this.allergeneService = allergeneService;
        this.listaContattiService = listaContattiService;
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
    public Optional<MenuCompletoDTO> findMenuCompleto(UUID id) {
        LOG.debug("Request to get MenuCompleto (aggregato) : {}", id);

        // Se il menu non esiste restituiamo subito empty → il controller risponde 404
        Optional<MenuDTO> menuOpt = menuRepository.findOneWithEagerRelationships(id).map(menuMapper::toDto);
        if (menuOpt.isEmpty()) {
            return Optional.empty();
        }
        MenuDTO menu = menuOpt.get();

        // Query unica per tutti i prodotti del menu con allergeni già in JOIN FETCH.
        // Sostituisce il loop N+1 (findByMenuId + findByPortataId per ogni portata).
        Map<UUID, List<ProdottoDTO>> prodottiPerPortata = prodottoService
            .findProdottiCompletiByMenuId(id)
            .stream()
            .collect(Collectors.groupingBy(p -> p.getPortata().getId()));

        // Portate con prodotti annidati — l'ordine canonico è garantito da findByMenuId
        List<PortataConProdottiDTO> portateConProdotti = portataService
            .findByMenuId(id)
            .stream()
            .map(portata ->
                new PortataConProdottiDTO(
                    portata.getId(),
                    portata.getTipo(),
                    portata.getNomeDefault(),
                    portata.getNomePersonalizzato(),
                    prodottiPerPortata.getOrDefault(portata.getId(), List.of())
                )
            )
            .toList();

        // Piatti del giorno attivi (già con allergeni — vedi findPiattiDelGiornoAttiviByMenuId)
        List<PiattoDelGiornoDTO> piattiDelGiorno = findPiattiDelGiornoAttiviByMenuId(id);

        // Immagini: solo metadati + contentUrl, senza byte[] (riduce payload da ~2.5 MB a ~1 KB)
        List<ImmagineMenuMetaDTO> immagini = immagineMenuService.findMetaByMenuId(id);
        List<AllergeneDTO> allergeni = allergeneService.findAll();
        List<ListaContattiDTO> contatti = listaContattiService.findByMenuId(id);

        return Optional.of(new MenuCompletoDTO(menu, portateConProdotti, piattiDelGiorno, immagini, allergeni, contatti));
    }
}
