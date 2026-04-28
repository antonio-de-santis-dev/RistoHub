package main.web.rest;

import java.util.List;
import java.util.Map;
import main.service.TraduzioneProxyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller pubblico che funge da proxy verso LibreTranslate.
 *
 * <p>Endpoint esposti (tutti sotto /api/public/** → permitAll senza autenticazione):
 *
 * <pre>
 *   POST /api/public/traduci
 *     Body:     { "testi": ["Testo 1", "Testo 2"], "lingua": "en" }
 *     Response: { "traduzioni": { "Testo 1": "Text 1", "Testo 2": "Text 2" }, "ok": true }
 *
 *   GET /api/public/traduci/health
 *     Response: { "disponibile": true/false, "provider": "LibreTranslate" }
 * </pre>
 *
 * <p>La sicurezza è gestita da SecurityConfiguration:
 *   .requestMatchers(mvc.pattern("/api/public/**")).permitAll()
 * → nessun JWT richiesto, accessibile ai menu pubblici (QR code).
 *
 * <p>NOTA: questo controller condivide il mapping /api/public con MenuPublicResource.
 * Spring li gestisce correttamente come controller separati sullo stesso prefisso.
 */
@RestController
@RequestMapping("/api/public")
public class TraduzioneProxyResource {

    private static final Logger log = LoggerFactory.getLogger(TraduzioneProxyResource.class);

    private final TraduzioneProxyService traduzioneService;

    public TraduzioneProxyResource(TraduzioneProxyService traduzioneService) {
        this.traduzioneService = traduzioneService;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // DTO di request / response
    // ──────────────────────────────────────────────────────────────────────────

    /** Request body inviato dal frontend Angular */
    record TraduzioneRequest(List<String> testi, String lingua) {}

    /** Response body restituito al frontend */
    record TraduzioneResponse(Map<String, String> traduzioni, boolean ok, String errore) {
        static TraduzioneResponse ok(Map<String, String> traduzioni) {
            return new TraduzioneResponse(traduzioni, true, null);
        }
        static TraduzioneResponse errore(String messaggio) {
            return new TraduzioneResponse(Map.of(), false, messaggio);
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Endpoint principale: POST /api/public/traduci
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Traduce una lista di testi in una lingua target usando LibreTranslate.
     *
     * <p>Il frontend invia la lista di stringhe del menu (nomi e descrizioni prodotti),
     * il backend le passa in batch a LibreTranslate e restituisce la mappa
     * { originale → tradotto }. Funziona per prodotti caricati manualmente
     * e per quelli importati da PDF.
     *
     * <p>Le stringhe vuote o null vengono ignorate.
     * Le traduzioni fallite vengono omesse (il frontend mostra il testo originale
     * come fallback).
     */
    @PostMapping("/traduci")
    public ResponseEntity<TraduzioneResponse> traduci(@RequestBody TraduzioneRequest request) {
        if (request == null || request.testi() == null || request.testi().isEmpty()) {
            return ResponseEntity.badRequest().body(TraduzioneResponse.errore("Nessun testo fornito"));
        }
        if (request.lingua() == null || request.lingua().isBlank()) {
            return ResponseEntity.badRequest().body(TraduzioneResponse.errore("Lingua non specificata"));
        }

        // Filtra stringhe vuote o null, rimuove duplicati
        List<String> testiValidi = request.testi().stream().filter(t -> t != null && !t.isBlank()).distinct().toList();

        if (testiValidi.isEmpty()) {
            return ResponseEntity.ok(TraduzioneResponse.ok(Map.of()));
        }

        log.debug("Traduzione batch: {} stringhe → lingua={}", testiValidi.size(), request.lingua());

        try {
            Map<String, String> traduzioni = traduzioneService.traduciBatch(testiValidi, request.lingua());
            log.debug("Traduzione completata: {}/{} stringhe tradotte", traduzioni.size(), testiValidi.size());
            return ResponseEntity.ok(TraduzioneResponse.ok(traduzioni));
        } catch (Exception e) {
            log.error("Errore durante traduzione batch (lingua={}): {}", request.lingua(), e.getMessage());
            return ResponseEntity.ok(TraduzioneResponse.errore("Errore durante la traduzione: " + e.getMessage()));
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Health check: GET /api/public/traduci/health
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Verifica se LibreTranslate è raggiungibile.
     * Utile per debug e monitoring.
     *
     * Risposta attesa quando tutto funziona:
     *   {"disponibile": true, "provider": "LibreTranslate"}
     */
    @GetMapping("/traduci/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean disponibile = traduzioneService.isDisponibile();
        return ResponseEntity.ok(Map.of("disponibile", disponibile, "provider", "LibreTranslate"));
    }
}
