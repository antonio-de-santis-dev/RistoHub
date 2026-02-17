package main.web.rest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import main.repository.AllergeneRepository;
import main.service.AllergeneService;
import main.service.dto.AllergeneDTO;
import main.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link main.domain.Allergene}.
 */
@RestController
@RequestMapping("/api/allergenes")
public class AllergeneResource {

    private static final Logger LOG = LoggerFactory.getLogger(AllergeneResource.class);

    private static final String ENTITY_NAME = "allergene";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final AllergeneService allergeneService;

    private final AllergeneRepository allergeneRepository;

    public AllergeneResource(AllergeneService allergeneService, AllergeneRepository allergeneRepository) {
        this.allergeneService = allergeneService;
        this.allergeneRepository = allergeneRepository;
    }

    /**
     * {@code POST  /allergenes} : Create a new allergene.
     *
     * @param allergeneDTO the allergeneDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new allergeneDTO, or with status {@code 400 (Bad Request)} if the allergene has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<AllergeneDTO> createAllergene(@Valid @RequestBody AllergeneDTO allergeneDTO) throws URISyntaxException {
        LOG.debug("REST request to save Allergene : {}", allergeneDTO);
        if (allergeneDTO.getId() != null) {
            throw new BadRequestAlertException("A new allergene cannot already have an ID", ENTITY_NAME, "idexists");
        }
        allergeneDTO = allergeneService.save(allergeneDTO);
        return ResponseEntity.created(new URI("/api/allergenes/" + allergeneDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, allergeneDTO.getId().toString()))
            .body(allergeneDTO);
    }

    /**
     * {@code PUT  /allergenes/:id} : Updates an existing allergene.
     *
     * @param id the id of the allergeneDTO to save.
     * @param allergeneDTO the allergeneDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated allergeneDTO,
     * or with status {@code 400 (Bad Request)} if the allergeneDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the allergeneDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<AllergeneDTO> updateAllergene(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody AllergeneDTO allergeneDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Allergene : {}, {}", id, allergeneDTO);
        if (allergeneDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, allergeneDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!allergeneRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        allergeneDTO = allergeneService.update(allergeneDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, allergeneDTO.getId().toString()))
            .body(allergeneDTO);
    }

    /**
     * {@code PATCH  /allergenes/:id} : Partial updates given fields of an existing allergene, field will ignore if it is null
     *
     * @param id the id of the allergeneDTO to save.
     * @param allergeneDTO the allergeneDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated allergeneDTO,
     * or with status {@code 400 (Bad Request)} if the allergeneDTO is not valid,
     * or with status {@code 404 (Not Found)} if the allergeneDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the allergeneDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<AllergeneDTO> partialUpdateAllergene(
        @PathVariable(value = "id", required = false) final UUID id,
        @NotNull @RequestBody AllergeneDTO allergeneDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Allergene partially : {}, {}", id, allergeneDTO);
        if (allergeneDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, allergeneDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!allergeneRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<AllergeneDTO> result = allergeneService.partialUpdate(allergeneDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, allergeneDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /allergenes} : get all the allergenes.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of allergenes in body.
     */
    @GetMapping("")
    public List<AllergeneDTO> getAllAllergenes() {
        LOG.debug("REST request to get all Allergenes");
        return allergeneService.findAll();
    }

    /**
     * {@code GET  /allergenes/:id} : get the "id" allergene.
     *
     * @param id the id of the allergeneDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the allergeneDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<AllergeneDTO> getAllergene(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get Allergene : {}", id);
        Optional<AllergeneDTO> allergeneDTO = allergeneService.findOne(id);
        return ResponseUtil.wrapOrNotFound(allergeneDTO);
    }

    /**
     * {@code DELETE  /allergenes/:id} : delete the "id" allergene.
     *
     * @param id the id of the allergeneDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAllergene(@PathVariable("id") UUID id) {
        LOG.debug("REST request to delete Allergene : {}", id);
        allergeneService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
