package main.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.domain.Menu;
import main.repository.MenuRepository;
import main.repository.PiattoDelGiornoRepository;
import main.security.SecurityUtils;
import main.service.dto.MenuDTO;
import main.service.mapper.MenuMapper;
import main.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link main.domain.Menu}.
 *
 * Responsabilità: CRUD del menu + ownership check.
 * L'assemblaggio dei DTO aggregati è delegato a {@link MenuCompletoService}.
 */
@Service
@Transactional
public class MenuService {

    private static final Logger LOG = LoggerFactory.getLogger(MenuService.class);

    private final MenuRepository menuRepository;
    private final MenuMapper menuMapper;
    private final PiattoDelGiornoRepository piattoDelGiornoRepository;

    public MenuService(MenuRepository menuRepository, MenuMapper menuMapper, PiattoDelGiornoRepository piattoDelGiornoRepository) {
        this.menuRepository = menuRepository;
        this.menuMapper = menuMapper;
        this.piattoDelGiornoRepository = piattoDelGiornoRepository;
    }

    /**
     * Save a menu.
     */
    public MenuDTO save(MenuDTO menuDTO) {
        LOG.debug("Request to save Menu : {}", menuDTO);
        return persistMenu(menuDTO);
    }

    /**
     * Update a menu.
     */
    public MenuDTO update(MenuDTO menuDTO) {
        LOG.debug("Request to update Menu : {}", menuDTO);
        checkOwnership(menuDTO.getId());
        return persistMenu(menuDTO);
    }

    // metodo privato condiviso — evita duplicazione tra save() e update()
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
     * Verifica che il menu con l'id dato appartenga all'utente corrente.
     * Lancia BadRequestAlertException se il menu non esiste o appartiene ad un altro utente.
     */
    public void checkOwnership(UUID id) {
        String currentLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new BadRequestAlertException("Utente non autenticato", "menu", "unauthenticated"));
        Menu menu = menuRepository.findById(id).orElseThrow(() -> new BadRequestAlertException("Menu non trovato", "menu", "idnotfound"));
        if (menu.getRistoratore() == null || !menu.getRistoratore().getLogin().equals(currentLogin)) {
            throw new BadRequestAlertException("Accesso negato", "menu", "forbidden");
        }
    }
}
