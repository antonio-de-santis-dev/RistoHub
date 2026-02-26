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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
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

    // ── CRUD Menu standard ────────────────────────────────

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

    @PutMapping("/{id}")
    public ResponseEntity<MenuDTO> updateMenu(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody MenuDTO menuDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to update Menu : {}, {}", id, menuDTO);
        if (menuDTO.getId() == null) throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        if (!Objects.equals(id, menuDTO.getId())) throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        if (!menuRepository.existsById(id)) throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        menuDTO = menuService.update(menuDTO);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, menuDTO.getId().toString()))
            .body(menuDTO);
    }

    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<MenuDTO> partialUpdateMenu(
        @PathVariable(value = "id", required = false) final UUID id,
        @NotNull @RequestBody MenuDTO menuDTO
    ) throws URISyntaxException {
        LOG.debug("REST request to partial update Menu partially : {}, {}", id, menuDTO);
        if (menuDTO.getId() == null) throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        if (!Objects.equals(id, menuDTO.getId())) throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        if (!menuRepository.existsById(id)) throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        Optional<MenuDTO> result = menuService.partialUpdate(menuDTO);
        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, menuDTO.getId().toString())
        );
    }

    @GetMapping("")
    public List<MenuDTO> getAllMenus(@RequestParam(name = "eagerload", required = false, defaultValue = "true") boolean eagerload) {
        LOG.debug("REST request to get all Menus");
        return menuService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuDTO> getMenu(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get Menu : {}", id);
        Optional<MenuDTO> menuDTO = menuService.findOne(id);
        return ResponseUtil.wrapOrNotFound(menuDTO);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMenu(@PathVariable("id") UUID id) {
        LOG.debug("REST request to delete Menu : {}", id);
        menuService.delete(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    // ── Portate & Piatti del giorno ───────────────────────

    @GetMapping("/{id}/portatas")
    public List<PortataDTO> getMenuPortatas(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get Portatas for Menu : {}", id);
        return portataService.findByMenuId(id);
    }

    @GetMapping("/{id}/piatti-del-giorno")
    public List<PiattoDelGiornoDTO> getPiattiDelGiornoByMenu(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get active PiattiDelGiorno for Menu : {}", id);
        return menuService.findPiattiDelGiornoAttiviByMenuId(id);
    }

    // ── Immagini carosello copertina ──────────────────────

    /**
     * GET /api/menus/{id}/immagini
     * Restituisce tutte le immagini del menu ordinate per 'ordine'.
     * Il campo 'immagine' (byte[]) viene serializzato come base64 da Jackson.
     */
    @GetMapping("/{id}/immagini")
    public List<ImmagineMenuDTO> getMenuImmagini(@PathVariable("id") UUID id) {
        LOG.debug("REST request to get Images for Menu : {}", id);
        return immagineMenuService.findByMenuId(id);
    }

    /**
     * POST /api/menus/{id}/immagini-copertina/upload  (multipart/form-data)
     * Carica una nuova immagine di copertina come BLOB nel DB.
     * Parametri form: file (MultipartFile)
     * Limite: max 5 immagini per menu.
     */
    @PostMapping(value = "/{id}/immagini-copertina/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImmagineMenuDTO> uploadImmagineCopertina(
        @PathVariable("id") UUID menuId,
        @RequestParam("file") MultipartFile file
    ) {
        LOG.debug("REST request to upload copertina for Menu : {}", menuId);
        if (file.isEmpty()) {
            throw new BadRequestAlertException("Il file è vuoto", "immagineMenu", "fileempty");
        }
        if (!menuRepository.existsById(menuId)) {
            throw new BadRequestAlertException("Menu non trovato", ENTITY_NAME, "idnotfound");
        }
        try {
            ImmagineMenuDTO result = immagineMenuService.uploadCopertina(menuId, file);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            // Limite 5 immagini raggiunto
            throw new BadRequestAlertException(e.getMessage(), "immagineMenu", "limitreached");
        } catch (Exception e) {
            LOG.error("Errore upload immagine copertina", e);
            throw new BadRequestAlertException("Errore durante l'upload dell'immagine", "immagineMenu", "uploaderror");
        }
    }

    /**
     * PUT /api/menus/{id}/immagini-copertina
     * Aggiorna ordine e visibilità delle immagini di copertina.
     * Body: lista di {id (UUID), ordine (int), visibile (boolean)}
     * NON sovrascrive i byte dell'immagine.
     *
     * Usato dal frontend menu-cover-editor al salvataggio.
     */
    @PutMapping("/{id}/immagini-copertina")
    public ResponseEntity<List<ImmagineMenuDTO>> aggiornaImmaginiCopertina(
        @PathVariable("id") UUID menuId,
        @RequestBody List<ImmagineMenuDTO> updates
    ) {
        LOG.debug("REST request to update immagini copertina for Menu : {}", menuId);
        if (!menuRepository.existsById(menuId)) {
            throw new BadRequestAlertException("Menu non trovato", ENTITY_NAME, "idnotfound");
        }
        try {
            List<ImmagineMenuDTO> result = immagineMenuService.aggiornaOrdineEVisibilita(menuId, updates);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            throw new BadRequestAlertException(e.getMessage(), "immagineMenu", "invalidmenu");
        }
    }

    /**
     * DELETE /api/menus/{menuId}/immagini-copertina/{immagineId}
     * Elimina una singola immagine di copertina.
     */
    @DeleteMapping("/{menuId}/immagini-copertina/{immagineId}")
    public ResponseEntity<Void> deleteImmagineCopertina(@PathVariable("menuId") UUID menuId, @PathVariable("immagineId") UUID immagineId) {
        LOG.debug("REST request to delete immagine copertina {} for Menu : {}", immagineId, menuId);
        immagineMenuService.delete(immagineId);
        return ResponseEntity.noContent().build();
    }
}
