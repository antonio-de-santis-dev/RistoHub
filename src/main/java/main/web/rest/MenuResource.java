package main.web.rest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import main.repository.MenuRepository;
import main.service.ImmagineMenuService;
import main.service.MenuService;
import main.service.PortataService;
import main.service.dto.ImmagineMenuDTO;
import main.service.dto.MenuDTO;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.dto.PortataDTO;
import main.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link main.domain.Menu}.
 */
@RestController
@RequestMapping("/api/menus")
public class MenuResource {

    private static final Logger LOG = LoggerFactory.getLogger(MenuResource.class);

    private static final String ENTITY_NAME = "menu";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final MenuService menuService;

    private final PortataService portataService;

    private final ImmagineMenuService immagineMenuService;

    private final MenuRepository menuRepository;

    public MenuResource(
        MenuService menuService,
        MenuRepository menuRepository,
        PortataService portataService,
        ImmagineMenuService immagineMenuService
    ) {
        this.menuService = menuService;
        this.menuRepository = menuRepository;
        this.portataService = portataService;
        this.immagineMenuService = immagineMenuService;
    }

    /**
     * {@code POST  /menus} : Create a new menu.
     *
     * @param menuDTO the menuDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new menuDTO, or with status {@code 400 (Bad Request)} if the menu has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<MenuDTO> createMenu(@Valid @RequestBody MenuDTO menuDTO) throws URISyntaxException {
        LOG.debug("REST request to save Menu : {}", menuDTO);
        if (menuDTO.getId() != null) {
            throw new BadRequestAlertException("A new menu cannot already have an ID", ENTITY_NAME, "idexists");
        }
        menuDTO = menuService.save(menuDTO);
        return ResponseEntity.created(new URI("/api/menus/" + menuDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, menuDTO.getId().toString()))
            .body(menuDTO);
    }

    /**
     * {@code PUT  /menus/:id} : Updates an existing menu.
     *
     * @param id the id of the menuDTO to save.
     * @param menuDTO the menuDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated menuDTO,
     * or with status {@code 400 (Bad Request)} if the menuDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the menuDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<MenuDTO> updateMenu(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody MenuDTO menuDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Menu : {}, {}", id, menuDTO);
        if (menuDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, menuDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!menuRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        menuDTO = menuService.update(menuDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, menuDTO.getId().toString()))
            .body(menuDTO);
    }

    /**
     * {@code PATCH  /menus/:id} : Partial updates given fields of an existing menu, field will ignore if it is null
     *
     * @param id the id of the menuDTO to save.
     * @param menuDTO the menuDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated menuDTO,
     * or with status {@code 400 (Bad Request)} if the menuDTO is not valid,
     * or with status {@code 404 (Not Found)} if the menuDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the menuDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<MenuDTO> partialUpdateMenu(
        @PathVariable(value = "id", required = false) final UUID id,
        @NotNull @RequestBody MenuDTO menuDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Menu partially : {}, {}", id, menuDTO);
        if (menuDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, menuDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!menuRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<MenuDTO> result = menuService.partialUpdate(menuDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, menuDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /menus} : get all the menus.
     *
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of menus in body.
     */
    @GetMapping("")
    public List<MenuDTO> getAllMenus(@RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload) {
        LOG.debug("REST request to get all Menus");
        return menuService.findAll();
    }

    /**
     * {@code GET  /menus/:id} : get the "id" menu.
     *
     * @param id the id of the menuDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the menuDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<MenuDTO> getMenu(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get Menu : {}", id);
        Optional<MenuDTO> menuDTO = menuService.findOne(id);
        return ResponseUtil.wrapOrNotFound(menuDTO);
    }

    /**
     * {@code DELETE  /menus/:id} : delete the "id" menu.
     *
     * @param id the id of the menuDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenu(@PathVariable("id") UUID id) {
        LOG.debug("REST request to delete Menu : {}", id);
        menuService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    @GetMapping("/{id}/portatas")
    public List<PortataDTO> getMenuPortatas(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get Portatas for Menu : {}", id);
        return portataService.findByMenuId(id);
    }

    @GetMapping("/{id}/immagini")
    public List<ImmagineMenuDTO> getMenuImmagini(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get Images for Menu : {}", id);
        return immagineMenuService.findByMenuId(id);
    }

    @GetMapping("/{id}/piatti-del-giorno")
    public List<PiattoDelGiornoDTO> getPiattiDelGiornoByMenu(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get active PiattiDelGiorno for Menu : {}", id);
        return menuService.findPiattiDelGiornoAttiviByMenuId(id);
    }
}
