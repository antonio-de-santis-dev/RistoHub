package main.web.rest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import main.repository.PiattoDelGiornoRepository;
import main.service.PiattoDelGiornoService;
import main.service.dto.PiattoDelGiornoDTO;
import main.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link main.domain.PiattoDelGiorno}.
 */
@RestController
@RequestMapping("/api/piatto-del-giornos")
public class PiattoDelGiornoResource {

    private static final Logger LOG = LoggerFactory.getLogger(PiattoDelGiornoResource.class);

    private static final String ENTITY_NAME = "piattoDelGiorno";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final PiattoDelGiornoService piattoDelGiornoService;

    private final PiattoDelGiornoRepository piattoDelGiornoRepository;

    public PiattoDelGiornoResource(PiattoDelGiornoService piattoDelGiornoService, PiattoDelGiornoRepository piattoDelGiornoRepository) {
        this.piattoDelGiornoService = piattoDelGiornoService;
        this.piattoDelGiornoRepository = piattoDelGiornoRepository;
    }

    /**
     * {@code POST  /piatto-del-giornos} : Create a new piattoDelGiorno.
     *
     * @param piattoDelGiornoDTO the piattoDelGiornoDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new piattoDelGiornoDTO, or with status {@code 400 (Bad Request)} if the piattoDelGiorno has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<PiattoDelGiornoDTO> createPiattoDelGiorno(@Valid @RequestBody PiattoDelGiornoDTO piattoDelGiornoDTO)
        throws URISyntaxException {
        LOG.debug("REST request to save PiattoDelGiorno : {}", piattoDelGiornoDTO);
        if (piattoDelGiornoDTO.getId() != null) {
            throw new BadRequestAlertException("A new piattoDelGiorno cannot already have an ID", ENTITY_NAME, "idexists");
        }
        piattoDelGiornoDTO = piattoDelGiornoService.save(piattoDelGiornoDTO);
        return ResponseEntity.created(new URI("/api/piatto-del-giornos/" + piattoDelGiornoDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, piattoDelGiornoDTO.getId().toString()))
            .body(piattoDelGiornoDTO);
    }

    /**
     * {@code PUT  /piatto-del-giornos/:id} : Updates an existing piattoDelGiorno.
     *
     * @param id the id of the piattoDelGiornoDTO to save.
     * @param piattoDelGiornoDTO the piattoDelGiornoDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated piattoDelGiornoDTO,
     * or with status {@code 400 (Bad Request)} if the piattoDelGiornoDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the piattoDelGiornoDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PiattoDelGiornoDTO> updatePiattoDelGiorno(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody PiattoDelGiornoDTO piattoDelGiornoDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update PiattoDelGiorno : {}, {}", id, piattoDelGiornoDTO);
        if (piattoDelGiornoDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, piattoDelGiornoDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!piattoDelGiornoRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        piattoDelGiornoDTO = piattoDelGiornoService.update(piattoDelGiornoDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, piattoDelGiornoDTO.getId().toString()))
            .body(piattoDelGiornoDTO);
    }

    /**
     * {@code PATCH  /piatto-del-giornos/:id} : Partial updates given fields of an existing piattoDelGiorno, field will ignore if it is null
     *
     * @param id the id of the piattoDelGiornoDTO to save.
     * @param piattoDelGiornoDTO the piattoDelGiornoDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated piattoDelGiornoDTO,
     * or with status {@code 400 (Bad Request)} if the piattoDelGiornoDTO is not valid,
     * or with status {@code 404 (Not Found)} if the piattoDelGiornoDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the piattoDelGiornoDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<PiattoDelGiornoDTO> partialUpdatePiattoDelGiorno(
        @PathVariable(value = "id", required = false) final UUID id,
        @NotNull @RequestBody PiattoDelGiornoDTO piattoDelGiornoDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update PiattoDelGiorno partially : {}, {}", id, piattoDelGiornoDTO);
        if (piattoDelGiornoDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, piattoDelGiornoDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!piattoDelGiornoRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<PiattoDelGiornoDTO> result = piattoDelGiornoService.partialUpdate(piattoDelGiornoDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, piattoDelGiornoDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /piatto-del-giornos} : get all the piattoDelGiornos.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of piattoDelGiornos in body.
     */
    @GetMapping("")
    public List<PiattoDelGiornoDTO> getAllPiattoDelGiornos() {
        LOG.debug("REST request to get all PiattoDelGiornos");
        return piattoDelGiornoService.findAll();
    }

    /**
     * {@code GET  /piatto-del-giornos/:id} : get the "id" piattoDelGiorno.
     *
     * @param id the id of the piattoDelGiornoDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the piattoDelGiornoDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PiattoDelGiornoDTO> getPiattoDelGiorno(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get PiattoDelGiorno : {}", id);
        Optional<PiattoDelGiornoDTO> piattoDelGiornoDTO = piattoDelGiornoService.findOne(id);
        return ResponseUtil.wrapOrNotFound(piattoDelGiornoDTO);
    }

    /**
     * {@code DELETE  /piatto-del-giornos/:id} : delete the "id" piattoDelGiorno.
     *
     * @param id the id of the piattoDelGiornoDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePiattoDelGiorno(@PathVariable("id") UUID id) {
        LOG.debug("REST request to delete PiattoDelGiorno : {}", id);
        piattoDelGiornoService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
