package main.web.rest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import main.repository.ImmagineMenuRepository;
import main.service.ImmagineMenuService;
import main.service.dto.ImmagineMenuDTO;
import main.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link main.domain.ImmagineMenu}.
 */
@RestController
@RequestMapping("/api/immagine-menus")
public class ImmagineMenuResource {

    private static final Logger LOG = LoggerFactory.getLogger(ImmagineMenuResource.class);

    private static final String ENTITY_NAME = "immagineMenu";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final ImmagineMenuService immagineMenuService;

    private final ImmagineMenuRepository immagineMenuRepository;

    public ImmagineMenuResource(ImmagineMenuService immagineMenuService, ImmagineMenuRepository immagineMenuRepository) {
        this.immagineMenuService = immagineMenuService;
        this.immagineMenuRepository = immagineMenuRepository;
    }

    /**
     * {@code POST  /immagine-menus} : Create a new immagineMenu.
     *
     * @param immagineMenuDTO the immagineMenuDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new immagineMenuDTO, or with status {@code 400 (Bad Request)} if the immagineMenu has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<ImmagineMenuDTO> createImmagineMenu(@Valid @RequestBody ImmagineMenuDTO immagineMenuDTO)
        throws URISyntaxException {
        LOG.debug("REST request to save ImmagineMenu : {}", immagineMenuDTO);
        if (immagineMenuDTO.getId() != null) {
            throw new BadRequestAlertException("A new immagineMenu cannot already have an ID", ENTITY_NAME, "idexists");
        }
        immagineMenuDTO = immagineMenuService.save(immagineMenuDTO);
        return ResponseEntity.created(new URI("/api/immagine-menus/" + immagineMenuDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, immagineMenuDTO.getId().toString()))
            .body(immagineMenuDTO);
    }

    /**
     * {@code PUT  /immagine-menus/:id} : Updates an existing immagineMenu.
     *
     * @param id the id of the immagineMenuDTO to save.
     * @param immagineMenuDTO the immagineMenuDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated immagineMenuDTO,
     * or with status {@code 400 (Bad Request)} if the immagineMenuDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the immagineMenuDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ImmagineMenuDTO> updateImmagineMenu(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody ImmagineMenuDTO immagineMenuDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update ImmagineMenu : {}, {}", id, immagineMenuDTO);
        if (immagineMenuDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, immagineMenuDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!immagineMenuRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        immagineMenuDTO = immagineMenuService.update(immagineMenuDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, immagineMenuDTO.getId().toString()))
            .body(immagineMenuDTO);
    }

    /**
     * {@code PATCH  /immagine-menus/:id} : Partial updates given fields of an existing immagineMenu, field will ignore if it is null
     *
     * @param id the id of the immagineMenuDTO to save.
     * @param immagineMenuDTO the immagineMenuDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated immagineMenuDTO,
     * or with status {@code 400 (Bad Request)} if the immagineMenuDTO is not valid,
     * or with status {@code 404 (Not Found)} if the immagineMenuDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the immagineMenuDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<ImmagineMenuDTO> partialUpdateImmagineMenu(
        @PathVariable(value = "id", required = false) final UUID id,
        @NotNull @RequestBody ImmagineMenuDTO immagineMenuDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update ImmagineMenu partially : {}, {}", id, immagineMenuDTO);
        if (immagineMenuDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, immagineMenuDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!immagineMenuRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<ImmagineMenuDTO> result = immagineMenuService.partialUpdate(immagineMenuDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, immagineMenuDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /immagine-menus} : get all the immagineMenus.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of immagineMenus in body.
     */
    @GetMapping("")
    public List<ImmagineMenuDTO> getAllImmagineMenus() {
        LOG.debug("REST request to get all ImmagineMenus");
        return immagineMenuService.findAll();
    }

    /**
     * {@code GET  /immagine-menus/:id} : get the "id" immagineMenu.
     *
     * @param id the id of the immagineMenuDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the immagineMenuDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ImmagineMenuDTO> getImmagineMenu(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get ImmagineMenu : {}", id);
        Optional<ImmagineMenuDTO> immagineMenuDTO = immagineMenuService.findOne(id);
        return ResponseUtil.wrapOrNotFound(immagineMenuDTO);
    }

    /**
     * {@code DELETE  /immagine-menus/:id} : delete the "id" immagineMenu.
     *
     * @param id the id of the immagineMenuDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImmagineMenu(@PathVariable("id") UUID id) {
        LOG.debug("REST request to delete ImmagineMenu : {}", id);
        immagineMenuService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
