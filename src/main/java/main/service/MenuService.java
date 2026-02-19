package main.service;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.Menu;
import main.repository.MenuRepository;
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

    public MenuService(MenuRepository menuRepository, MenuMapper menuMapper, PiattoDelGiornoMapper piattoDelGiornoMapper) {
        this.menuRepository = menuRepository;
        this.menuMapper = menuMapper;
        this.piattoDelGiornoMapper = piattoDelGiornoMapper;
    }

    /**
     * Save a menu.
     *
     * @param menuDTO the entity to save.
     * @return the persisted entity.
     */
    public MenuDTO save(MenuDTO menuDTO) {
        LOG.debug("Request to save Menu : {}", menuDTO);
        Menu menu = menuMapper.toEntity(menuDTO);
        menu = menuRepository.save(menu);
        return menuMapper.toDto(menu);
    }

    /**
     * Update a menu.
     *
     * @param menuDTO the entity to save.
     * @return the persisted entity.
     */
    public MenuDTO update(MenuDTO menuDTO) {
        LOG.debug("Request to update Menu : {}", menuDTO);
        Menu menu = menuMapper.toEntity(menuDTO);
        menu = menuRepository.save(menu);
        return menuMapper.toDto(menu);
    }

    /**
     * Partially update a menu.
     *
     * @param menuDTO the entity to update partially.
     * @return the persisted entity.
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
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<MenuDTO> findAll() {
        LOG.debug("Request to get all Menus");
        return menuRepository.findAll().stream().map(menuMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get all the menus with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<MenuDTO> findAllWithEagerRelationships(Pageable pageable) {
        return menuRepository.findAllWithEagerRelationships(pageable).map(menuMapper::toDto);
    }

    /**
     * Get one menu by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<MenuDTO> findOne(UUID id) {
        LOG.debug("Request to get Menu : {}", id);
        return menuRepository.findOneWithEagerRelationships(id).map(menuMapper::toDto);
    }

    /**
     * Delete the menu by id.
     *
     * @param id the id of the entity.
     */
    public void delete(UUID id) {
        LOG.debug("Request to delete Menu : {}", id);
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
