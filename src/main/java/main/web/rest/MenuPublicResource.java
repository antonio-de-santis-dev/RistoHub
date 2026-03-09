package main.web.rest;

import java.util.List;
import java.util.UUID;
import main.service.AllergeneService;
import main.service.ImmagineMenuService;
import main.service.ListaContattiService;
import main.service.MenuService;
import main.service.PortataService;
import main.service.ProdottoService;
import main.service.dto.AllergeneDTO;
import main.service.dto.ImmagineMenuDTO;
import main.service.dto.ListaContattiDTO;
import main.service.dto.MenuCompletoDTO;
import main.service.dto.MenuDTO;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.dto.PortataDTO;
import main.service.dto.ProdottoDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller pubblico (senza autenticazione) per la visualizzazione del menu da QR code.
 * Espone endpoint di sola lettura raggiungibili da qualsiasi utente non registrato.
 *
 * Tutti gli endpoint sono sotto /api/public/** e vengono esplicitamente
 * configurati come permitAll() in SecurityConfiguration.
 */
@RestController
@RequestMapping("/api/public")
public class MenuPublicResource {

    private static final Logger LOG = LoggerFactory.getLogger(MenuPublicResource.class);

    private final MenuService menuService;
    private final PortataService portataService;
    private final ProdottoService prodottoService;
    private final ImmagineMenuService immagineMenuService;
    private final AllergeneService allergeneService;
    private final ListaContattiService listaContattiService;

    public MenuPublicResource(
        MenuService menuService,
        PortataService portataService,
        ProdottoService prodottoService,
        ImmagineMenuService immagineMenuService,
        AllergeneService allergeneService,
        ListaContattiService listaContattiService
    ) {
        this.menuService = menuService;
        this.portataService = portataService;
        this.prodottoService = prodottoService;
        this.immagineMenuService = immagineMenuService;
        this.allergeneService = allergeneService;
        this.listaContattiService = listaContattiService;
    }

    /**
     * GET /api/public/menus/{id}
     * Dettagli del menu (nome, colori, template, font).
     */
    @GetMapping("/menus/{id}")
    public ResponseEntity<MenuDTO> getMenu(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to get Menu : {}", id);
        return menuService.findOne(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/public/menus/{id}/portatas
     * Lista delle portate del menu.
     */
    @GetMapping("/menus/{id}/portatas")
    public List<PortataDTO> getPortate(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to get portate for Menu : {}", id);
        return portataService.findByMenuId(id);
    }

    /**
     * GET /api/public/menus/{id}/piatti-del-giorno
     * Piatti del giorno attivi per il menu.
     */
    @GetMapping("/menus/{id}/piatti-del-giorno")
    public List<PiattoDelGiornoDTO> getPiattiDelGiorno(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to get piatti del giorno for Menu : {}", id);
        return menuService.findPiattiDelGiornoAttiviByMenuId(id);
    }

    /**
     * GET /api/public/menus/{id}/immagini
     * Immagini del menu (logo + copertine visibili).
     */
    @GetMapping("/menus/{id}/immagini")
    public List<ImmagineMenuDTO> getImmagini(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to get immagini for Menu : {}", id);
        return immagineMenuService.findByMenuId(id);
    }

    /**
     * GET /api/public/prodottos/by-portata/{portataId}
     * Prodotti di una specifica portata.
     */
    @GetMapping("/prodottos/by-portata/{portataId}")
    public List<ProdottoDTO> getProdottiByPortata(@PathVariable("portataId") UUID portataId) {
        LOG.debug("PUBLIC request to get prodotti for Portata : {}", portataId);
        return prodottoService.findByPortataId(portataId);
    }

    /**
     * GET /api/public/allergenes
     * Lista completa degli allergeni (necessari per mostrare icone/nomi).
     */
    @GetMapping("/allergenes")
    public List<AllergeneDTO> getAllergeni() {
        LOG.debug("PUBLIC request to get all allergeni");
        return allergeneService.findAll();
    }

    /**
     * GET /api/public/lista-contattis/menu/{menuId}
     * Contatti associati al menu.
     */
    @GetMapping("/lista-contattis/menu/{menuId}")
    public List<ListaContattiDTO> getContattiByMenu(@PathVariable("menuId") UUID menuId) {
        LOG.debug("PUBLIC request to get contatti for Menu : {}", menuId);
        return listaContattiService.findByMenuId(menuId);
    }

    /**
     * GET /api/public/menus/{id}/full
     * Endpoint aggregato: restituisce menu + portate + prodotti + immagini + allergeni + contatti
     * in una sola chiamata HTTP. Elimina il pattern N+6 del frontend.
     */
    @GetMapping("/menus/{id}/full")
    public ResponseEntity<MenuCompletoDTO> getMenuCompleto(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to get MenuCompleto (aggregato) : {}", id);
        return menuService.findMenuCompleto(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
