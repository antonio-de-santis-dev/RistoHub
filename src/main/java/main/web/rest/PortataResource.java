package main.web.rest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import main.repository.PortataRepository;
import main.service.PortataService;
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
 * REST controller for managing {@link main.domain.Portata}.
 */
@RestController
@RequestMapping("/api/portatas")
public class PortataResource {

    private static final Logger LOG = LoggerFactory.getLogger(PortataResource.class);

    private static final String ENTITY_NAME = "portata";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final PortataService portataService;

    private final PortataRepository portataRepository;

    public PortataResource(PortataService portataService, PortataRepository portataRepository) {
        this.portataService = portataService;
        this.portataRepository = portataRepository;
    }

    /**
     * {@code POST  /portatas} : Create a new portata.
     *
     * @param portataDTO the portataDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new portataDTO, or with status {@code 400 (Bad Request)} if the portata has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<PortataDTO> createPortata(@Valid @RequestBody PortataDTO portataDTO) throws URISyntaxException {
        LOG.debug("REST request to save Portata : {}", portataDTO);
        if (portataDTO.getId() != null) {
            throw new BadRequestAlertException("A new portata cannot already have an ID", ENTITY_NAME, "idexists");
        }
        portataDTO = portataService.save(portataDTO);
        return ResponseEntity.created(new URI("/api/portatas/" + portataDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, portataDTO.getId().toString()))
            .body(portataDTO);
    }

    /**
     * {@code PUT  /portatas/:id} : Updates an existing portata.
     *
     * @param id the id of the portataDTO to save.
     * @param portataDTO the portataDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated portataDTO,
     * or with status {@code 400 (Bad Request)} if the portataDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the portataDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PortataDTO> updatePortata(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody PortataDTO portataDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Portata : {}, {}", id, portataDTO);
        if (portataDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, portataDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!portataRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        portataDTO = portataService.update(portataDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, portataDTO.getId().toString()))
            .body(portataDTO);
    }

    /**
     * {@code PATCH  /portatas/:id} : Partial updates given fields of an existing portata, field will ignore if it is null
     *
     * @param id the id of the portataDTO to save.
     * @param portataDTO the portataDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated portataDTO,
     * or with status {@code 400 (Bad Request)} if the portataDTO is not valid,
     * or with status {@code 404 (Not Found)} if the portataDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the portataDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<PortataDTO> partialUpdatePortata(
        @PathVariable(value = "id", required = false) final UUID id,
        @NotNull @RequestBody PortataDTO portataDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Portata partially : {}, {}", id, portataDTO);
        if (portataDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, portataDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!portataRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<PortataDTO> result = portataService.partialUpdate(portataDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, portataDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /portatas} : get all the portatas.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of portatas in body.
     */
    @GetMapping("")
    public List<PortataDTO> getAllPortatas() {
        LOG.debug("REST request to get all Portatas");
        return portataService.findAll();
    }

    /**
     * {@code GET  /portatas/:id} : get the "id" portata.
     *
     * @param id the id of the portataDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the portataDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PortataDTO> getPortata(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get Portata : {}", id);
        Optional<PortataDTO> portataDTO = portataService.findOne(id);
        return ResponseUtil.wrapOrNotFound(portataDTO);
    }

    /**
     * {@code DELETE  /portatas/:id} : delete the "id" portata.
     *
     * @param id the id of the portataDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePortata(@PathVariable("id") UUID id) {
        LOG.debug("REST request to delete Portata : {}", id);
        portataService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
