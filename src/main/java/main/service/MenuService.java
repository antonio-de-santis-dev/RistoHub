package main.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.Menu;
import main.domain.PiattoDelGiorno;
import main.repository.MenuRepository;
import main.repository.PiattoDelGiornoRepository;
import main.service.dto.MenuDTO;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.mapper.MenuMapper;
import main.service.mapper.PiattoDelGiornoMapper;
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

    public MenuService(
        MenuRepository menuRepository,
        MenuMapper menuMapper,
        PiattoDelGiornoMapper piattoDelGiornoMapper,
        PiattoDelGiornoRepository piattoDelGiornoRepository
    ) {
        this.menuRepository = menuRepository;
        this.menuMapper = menuMapper;
        this.piattoDelGiornoMapper = piattoDelGiornoMapper;
        this.piattoDelGiornoRepository = piattoDelGiornoRepository;
    }

    /**
     * Save a menu.
     */
    public MenuDTO save(MenuDTO menuDTO) {
        LOG.debug("Request to save Menu : {}", menuDTO);
        Menu menu = menuMapper.toEntity(menuDTO);
        menu = menuRepository.save(menu);
        return menuMapper.toDto(menu);
    }

    /**
     * Update a menu.
     */
    public MenuDTO update(MenuDTO menuDTO) {
        LOG.debug("Request to update Menu : {}", menuDTO);
        Menu menu = menuMapper.toEntity(menuDTO);
        menu = menuRepository.save(menu);
        return menuMapper.toDto(menu);
    }

    /**
     * Partially update a menu.
     */
    public Optional<MenuDTO> partialUpdate(MenuDTO menuDTO) {
        LOG.debug("Request to partially update Menu : {}", menuDTO);
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
     * Get all the menus.
     */
    @Transactional(readOnly = true)
    public List<MenuDTO> findAll() {
        LOG.debug("Request to get all Menus");
        return menuRepository.findAll().stream().map(menuMapper::toDto).collect(Collectors.toList());
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

        return baseList.stream().map(piattoDelGiornoMapper::toDto).collect(Collectors.toList());
    }
}
