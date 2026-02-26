package main.web.rest;

import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.repository.ListaContattiRepository;
import main.service.ListaContattiService;
import main.service.dto.ListaContattiDTO;
import main.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller per {@link main.domain.ListaContatti}.
 *
 * Accessibile a TUTTI gli utenti registrati (ROLE_USER e ROLE_ADMIN).
 * NON limitato ai soli amministratori.
 *
 * Ogni utente vede/modifica esclusivamente le proprie liste grazie al
 * filtro sul login nel Service e nel Repository.
 *
 * Endpoints:
 *   GET    /api/lista-contattis               – liste dell'utente corrente
 *   GET    /api/lista-contattis/{id}          – singola lista
 *   GET    /api/lista-contattis/menu/{menuId} – liste per menu (pubblico)
 *   POST   /api/lista-contattis               – crea nuova lista
 *   PUT    /api/lista-contattis/{id}          – aggiorna lista
 *   DELETE /api/lista-contattis/{id}          – elimina lista
 */
@RestController
@RequestMapping("/api/lista-contattis")
@PreAuthorize("hasAnyAuthority('ROLE_USER', 'ROLE_ADMIN')")
public class ListaContattiResource {

    private static final Logger LOG = LoggerFactory.getLogger(ListaContattiResource.class);
    private static final String ENTITY_NAME = "listaContatti";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final ListaContattiService listaContattiService;
    private final ListaContattiRepository listaContattiRepository;

    public ListaContattiResource(ListaContattiService listaContattiService, ListaContattiRepository listaContattiRepository) {
        this.listaContattiService = listaContattiService;
        this.listaContattiRepository = listaContattiRepository;
    }

    // ── CREATE ────────────────────────────────────────────────────

    @PostMapping("")
    public ResponseEntity<ListaContattiDTO> create(@Valid @RequestBody ListaContattiDTO dto) throws URISyntaxException {
        LOG.debug("REST request to save ListaContatti : {}", dto);
        if (dto.getId() != null) {
            throw new BadRequestAlertException("Una nuova lista non può avere un ID", ENTITY_NAME, "idexists");
        }
        ListaContattiDTO result = listaContattiService.save(dto);
        return ResponseEntity.created(new URI("/api/lista-contattis/" + result.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, result.getId().toString()))
            .body(result);
    }

    // ── UPDATE ────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<ListaContattiDTO> update(@PathVariable("id") UUID id, @Valid @RequestBody ListaContattiDTO dto) {
        LOG.debug("REST request to update ListaContatti : {}, {}", id, dto);
        if (dto.getId() == null) throw new BadRequestAlertException("ID obbligatorio", ENTITY_NAME, "idnull");
        if (!id.equals(dto.getId())) throw new BadRequestAlertException("ID non corrispondente", ENTITY_NAME, "idinvalid");
        if (!listaContattiRepository.existsById(id)) {
            throw new BadRequestAlertException("Lista non trovata", ENTITY_NAME, "idnotfound");
        }
        ListaContattiDTO result = listaContattiService.update(dto);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, result.getId().toString()))
            .body(result);
    }

    // ── READ ──────────────────────────────────────────────────────

    /**
     * Tutte le liste dell'utente autenticato (ROLE_USER o ROLE_ADMIN).
     */
    @GetMapping("")
    public List<ListaContattiDTO> getAll() {
        LOG.debug("REST request to get all ListaContatti for current user");
        return listaContattiService.findAllByCurrentUser();
    }

    /**
     * Singola lista per ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ListaContattiDTO> getOne(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get ListaContatti : {}", id);
        Optional<ListaContattiDTO> dto = listaContattiService.findOne(id);
        return ResponseUtil.wrapOrNotFound(dto);
    }

    /**
     * Liste associate a un menu specifico.
     * Usato dal menu-view per mostrare i contatti al cliente finale.
     * Accessibile pubblicamente (override del @PreAuthorize di classe).
     */
    @GetMapping("/menu/{menuId}")
    @PreAuthorize("permitAll()")
    public List<ListaContattiDTO> getByMenu(@PathVariable("menuId") UUID menuId) {
        LOG.debug("REST request to get ListaContatti for Menu : {}", menuId);
        return listaContattiService.findByMenuId(menuId);
    }

    // ── DELETE ────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") UUID id) {
        LOG.debug("REST request to delete ListaContatti : {}", id);
        if (!listaContattiRepository.existsById(id)) {
            throw new BadRequestAlertException("Lista non trovata", ENTITY_NAME, "idnotfound");
        }
        listaContattiService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
