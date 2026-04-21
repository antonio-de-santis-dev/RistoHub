package main.web.rest;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import main.domain.PiattoDelGiorno;
import main.domain.Portata;
import main.domain.Prodotto;
import main.repository.PiattoDelGiornoRepository;
import main.repository.PortataRepository;
import main.repository.ProdottoRepository;
import main.service.AllergeneService;
import main.service.ImmagineMenuService;
import main.service.ListaContattiService;
import main.service.MenuCompletoService;
import main.service.MenuService;
import main.service.PortataService;
import main.service.ProdottoService;
import main.service.TraduzioneDeepLService;
import main.service.dto.AllergeneDTO;
import main.service.dto.ImmagineMenuMetaDTO;
import main.service.dto.ListaContattiDTO;
import main.service.dto.MenuCompletoDTO;
import main.service.dto.MenuDTO;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.dto.PortataDTO;
import main.service.dto.ProdottoDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * Controller pubblico (senza autenticazione) per la visualizzazione del menu da QR code.
 */
@RestController
@RequestMapping("/api/public")
public class MenuPublicResource {

    private static final Logger LOG = LoggerFactory.getLogger(MenuPublicResource.class);

    private final MenuService menuService;
    private final MenuCompletoService menuCompletoService;
    private final PortataService portataService;
    private final ProdottoService prodottoService;
    private final ImmagineMenuService immagineMenuService;
    private final AllergeneService allergeneService;
    private final ListaContattiService listaContattiService;
    private final TraduzioneDeepLService traduzioneDeepLService;
    private final ProdottoRepository prodottoRepository;
    private final PortataRepository portataRepository;
    private final PiattoDelGiornoRepository piattoDelGiornoRepository;
    private final CacheManager cacheManager;

    public MenuPublicResource(
        MenuService menuService,
        MenuCompletoService menuCompletoService,
        PortataService portataService,
        ProdottoService prodottoService,
        ImmagineMenuService immagineMenuService,
        AllergeneService allergeneService,
        ListaContattiService listaContattiService,
        TraduzioneDeepLService traduzioneDeepLService,
        ProdottoRepository prodottoRepository,
        PortataRepository portataRepository,
        PiattoDelGiornoRepository piattoDelGiornoRepository,
        CacheManager cacheManager
    ) {
        this.menuService = menuService;
        this.menuCompletoService = menuCompletoService;
        this.portataService = portataService;
        this.prodottoService = prodottoService;
        this.immagineMenuService = immagineMenuService;
        this.allergeneService = allergeneService;
        this.listaContattiService = listaContattiService;
        this.traduzioneDeepLService = traduzioneDeepLService;
        this.prodottoRepository = prodottoRepository;
        this.portataRepository = portataRepository;
        this.piattoDelGiornoRepository = piattoDelGiornoRepository;
        this.cacheManager = cacheManager;
    }

    @GetMapping("/menus/{id}")
    public ResponseEntity<MenuDTO> getMenu(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to get Menu : {}", id);
        return menuService.findOne(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/menus/{id}/portatas")
    public List<PortataDTO> getPortate(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to get portate for Menu : {}", id);
        return portataService.findByMenuId(id);
    }

    @GetMapping("/menus/{id}/piatti-del-giorno")
    public List<PiattoDelGiornoDTO> getPiattiDelGiorno(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to get piatti del giorno for Menu : {}", id);
        return menuCompletoService.findPiattiDelGiornoAttiviByMenuId(id);
    }

    @GetMapping("/menus/{id}/immagini")
    public List<ImmagineMenuMetaDTO> getImmagini(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to get immagini meta for Menu : {}", id);
        return immagineMenuService.findMetaByMenuId(id);
    }

    @GetMapping("/immagini/{id}/content")
    public ResponseEntity<byte[]> getImmagineContent(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to get image content : {}", id);
        return immagineMenuService
            .findOne(id)
            .filter(dto -> dto.getImmagine() != null && dto.getImmagineContentType() != null)
            .map(dto ->
                ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(dto.getImmagineContentType()))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(dto.getImmagine())
            )
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/prodottos/by-portata/{portataId}")
    public List<ProdottoDTO> getProdottiByPortata(@PathVariable("portataId") UUID portataId) {
        LOG.debug("PUBLIC request to get prodotti for Portata : {}", portataId);
        return prodottoService.findByPortataId(portataId);
    }

    @GetMapping("/allergenes")
    public List<AllergeneDTO> getAllergeni() {
        LOG.debug("PUBLIC request to get all allergeni");
        return allergeneService.findAll();
    }

    @GetMapping("/lista-contattis/menu/{menuId}")
    public List<ListaContattiDTO> getContattiByMenu(@PathVariable("menuId") UUID menuId) {
        LOG.debug("PUBLIC request to get contatti for Menu : {}", menuId);
        return listaContattiService.findByMenuId(menuId);
    }

    @GetMapping("/menus/{id}/full")
    public ResponseEntity<MenuCompletoDTO> getMenuCompleto(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to get MenuCompleto (aggregato) : {}", id);
        return menuCompletoService.findMenuCompleto(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Endpoint di fallback: traduce le entità (prodotti, portate personalizzate, piatti
     * del giorno personalizzati) di un menu che non hanno ancora traduzioni nel campo
     * {@code traduzioni}. Chiamato dal frontend la prima volta che un utente cambia lingua
     * su un menu "legacy" (prodotti creati prima dell'introduzione di DeepL).
     *
     * Dopo la traduzione invalida la cache del menuCompleto così che il prossimo GET /full
     * restituisca le nuove traduzioni.
     */
    @PostMapping("/menus/{id}/translate-missing")
    @Transactional
    public ResponseEntity<Map<String, Object>> traduciMancanti(@PathVariable("id") UUID id) {
        LOG.debug("PUBLIC request to translate missing entities for Menu : {}", id);

        if (!traduzioneDeepLService.isAttivo()) {
            return ResponseEntity.ok(Map.of("tradotti", 0, "attivo", false, "messaggio", "DeepL non configurato"));
        }

        int contatore = 0;

        // 1. Prodotti senza traduzioni
        List<Prodotto> prodottiLegacy = prodottoRepository.findProdottiSenzaTraduzioniByMenuId(id);
        for (Prodotto p : prodottiLegacy) {
            String json = traduzioneDeepLService.buildTraduzioniJson(p.getNome(), p.getDescrizione());
            if (json != null) {
                p.setTraduzioni(json);
                prodottoRepository.save(p);
                contatore++;
            }
        }

        // 2. Portate PERSONALIZZATA senza traduzioni
        List<Portata> portateLegacy = portataRepository
            .findByMenuIdOrdered(id)
            .stream()
            .filter(p -> p.getTipo() != null && "PERSONALIZZATA".equals(p.getTipo().name()))
            .filter(p -> p.getTraduzioni() == null || p.getTraduzioni().isBlank())
            .filter(p -> p.getNomePersonalizzato() != null && !p.getNomePersonalizzato().isBlank())
            .toList();
        for (Portata p : portateLegacy) {
            String json = traduzioneDeepLService.buildTraduzioniJson(Map.of("nomePersonalizzato", p.getNomePersonalizzato()));
            if (json != null) {
                p.setTraduzioni(json);
                portataRepository.save(p);
                contatore++;
            }
        }

        // 3. Piatti del giorno personalizzati senza traduzioni
        List<PiattoDelGiorno> piattiLegacy = piattoDelGiornoRepository.findByMenuIdWithNullTraduzioni(id);
        for (PiattoDelGiorno p : piattiLegacy) {
            // Solo piatti personalizzati (senza prodotto collegato)
            if (p.getProdotto() != null) continue;
            if ((p.getNome() == null || p.getNome().isBlank()) && (p.getDescrizione() == null || p.getDescrizione().isBlank())) continue;
            String json = traduzioneDeepLService.buildTraduzioniJson(p.getNome(), p.getDescrizione());
            if (json != null) {
                p.setTraduzioni(json);
                piattoDelGiornoRepository.save(p);
                contatore++;
            }
        }

        // Invalidiamo la cache del menu così il prossimo GET /full riparte con le traduzioni
        if (contatore > 0) {
            if (cacheManager.getCache("menuCompleto") != null) {
                cacheManager.getCache("menuCompleto").evict(id);
            }
            if (cacheManager.getCache("piattiGiorno") != null) {
                cacheManager.getCache("piattiGiorno").evict(id);
            }
        }

        LOG.info("Tradotte {} entità legacy per menu {}", contatore, id);
        return ResponseEntity.ok(Map.of("tradotti", contatore, "attivo", true));
    }
}
