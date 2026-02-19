package main.service;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.Menu;
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
        return menuRepository.findAll().stream().map(menuMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get all the menus with eager load of many-to-many relationships.
     */
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
     * Prima elimina tutti i piatti del giorno collegati (FK constraint),
     * poi elimina il menu stesso.
     */
    public void delete(UUID id) {
        LOG.debug("Request to delete Menu : {}", id);

        // 1. Elimina prima i piatti del giorno collegati al menu
        //    (FK_PIATTO_DEL_GIORNO_MENU_ID blocca altrimenti la delete)
        piattoDelGiornoRepository.deleteByMenuId(id);

        // 2. Flush per assicurarsi che la delete dei piatti venga eseguita
        //    prima della delete del menu nella stessa transazione
        piattoDelGiornoRepository.flush();

        // 3. Ora elimina il menu (le portate e i prodotti sono gestiti
        //    dal cascade della entity o dal loro service)
        menuRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<PiattoDelGiornoDTO> findPiattiDelGiornoAttiviByMenuId(UUID menuId) {
        LOG.debug("Request to get active PiattiDelGiorno for Menu : {}", menuId);
        return menuRepository
            .findPiattiDelGiornoAttiviByMenuId(menuId)
            .stream()
            .map(piattoDelGiornoMapper::toDto)
            .collect(Collectors.toList());
    }
}
