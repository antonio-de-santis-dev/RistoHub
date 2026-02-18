package main.web.rest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import main.repository.ProdottoRepository;
import main.service.ProdottoService;
import main.service.dto.ProdottoDTO;
import main.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link main.domain.Prodotto}.
 */
@RestController
@RequestMapping("/api/prodottos")
public class ProdottoResource {

    private static final Logger LOG = LoggerFactory.getLogger(ProdottoResource.class);

    private static final String ENTITY_NAME = "prodotto";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final ProdottoService prodottoService;

    private final ProdottoRepository prodottoRepository;

    public ProdottoResource(ProdottoService prodottoService, ProdottoRepository prodottoRepository) {
        this.prodottoService = prodottoService;
        this.prodottoRepository = prodottoRepository;
    }

    /**
     * {@code POST  /prodottos} : Create a new prodotto.
     *
     * @param prodottoDTO the prodottoDTO to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new prodottoDTO, or with status {@code 400 (Bad Request)} if the prodotto has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<ProdottoDTO> createProdotto(@Valid @RequestBody ProdottoDTO prodottoDTO) throws URISyntaxException {
        LOG.debug("REST request to save Prodotto : {}", prodottoDTO);
        if (prodottoDTO.getId() != null) {
            throw new BadRequestAlertException("A new prodotto cannot already have an ID", ENTITY_NAME, "idexists");
        }
        prodottoDTO = prodottoService.save(prodottoDTO);
        return ResponseEntity.created(new URI("/api/prodottos/" + prodottoDTO.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, prodottoDTO.getId().toString()))
            .body(prodottoDTO);
    }

    /**
     * {@code PUT  /prodottos/:id} : Updates an existing prodotto.
     *
     * @param id the id of the prodottoDTO to save.
     * @param prodottoDTO the prodottoDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated prodottoDTO,
     * or with status {@code 400 (Bad Request)} if the prodottoDTO is not valid,
     * or with status {@code 500 (Internal Server Error)} if the prodottoDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProdottoDTO> updateProdotto(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody ProdottoDTO prodottoDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Prodotto : {}, {}", id, prodottoDTO);
        if (prodottoDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, prodottoDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!prodottoRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        prodottoDTO = prodottoService.update(prodottoDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, prodottoDTO.getId().toString()))
            .body(prodottoDTO);
    }

    /**
     * {@code PATCH  /prodottos/:id} : Partial updates given fields of an existing prodotto, field will ignore if it is null
     *
     * @param id the id of the prodottoDTO to save.
     * @param prodottoDTO the prodottoDTO to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated prodottoDTO,
     * or with status {@code 400 (Bad Request)} if the prodottoDTO is not valid,
     * or with status {@code 404 (Not Found)} if the prodottoDTO is not found,
     * or with status {@code 500 (Internal Server Error)} if the prodottoDTO couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<ProdottoDTO> partialUpdateProdotto(
        @PathVariable(value = "id", required = false) final UUID id,
        @NotNull @RequestBody ProdottoDTO prodottoDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Prodotto partially : {}, {}", id, prodottoDTO);
        if (prodottoDTO.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, prodottoDTO.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!prodottoRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<ProdottoDTO> result = prodottoService.partialUpdate(prodottoDTO);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, prodottoDTO.getId().toString())
        );
    }

    /**
     * {@code GET  /prodottos} : get all the prodottos.
     *
     * @param eagerload flag to eager load entities from relationships (This is applicable for many-to-many).
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of prodottos in body.
     */
    @GetMapping("")
    public List<ProdottoDTO> getAllProdottos(@RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload) {
        LOG.debug("REST request to get all Prodottos");
        return prodottoService.findAll();
    }

    /**
     * {@code GET  /prodottos/:id} : get the "id" prodotto.
     *
     * @param id the id of the prodottoDTO to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the prodottoDTO, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProdottoDTO> getProdotto(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get Prodotto : {}", id);
        Optional<ProdottoDTO> prodottoDTO = prodottoService.findOne(id);
        return ResponseUtil.wrapOrNotFound(prodottoDTO);
    }

    /**
     * {@code DELETE  /prodottos/:id} : delete the "id" prodotto.
     *
     * @param id the id of the prodottoDTO to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProdotto(@PathVariable("id") UUID id) {
        LOG.debug("REST request to delete Prodotto : {}", id);
        prodottoService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    @GetMapping("/by-portata/{portataId}")
    public List<ProdottoDTO> getProdottosByPortata(@PathVariable("portataId") UUID portataId) {
        LOG.debug("REST request to get Prodottos for Portata : {}", portataId);
        return prodottoService.findByPortataId(portataId);
    }
}
