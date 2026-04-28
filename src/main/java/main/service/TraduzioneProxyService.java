package main.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Servizio che funge da proxy verso LibreTranslate.
 *
 * <p>LibreTranslate è un motore di traduzione open source, self-hostable e
 * completamente gratuito (senza limiti di quota quando self-hosted).
 *
 * <p>Il frontend Angular chiama /api/public/traduci → questo servizio →
 * LibreTranslate (locale o pubblico). In questo modo la chiamata esce
 * dall'IP del server, non dall'IP del client browser, evitando tutti i
 * problemi di quota/CORS del vecchio approccio MyMemory diretto.
 *
 * <p>Configurazione (application.yml):
 * <pre>
 *   libretranslate:
 *     url: http://localhost:5000   # URL del container LibreTranslate
 *     api-key:                     # Lascia vuoto se self-hosted senza auth
 * </pre>
 *
 * @deprecated MyMemory è stato rimosso — questo servizio lo sostituisce.
 */
@Service
public class TraduzioneProxyService {

    private static final Logger log = LoggerFactory.getLogger(TraduzioneProxyService.class);

    /** URL base di LibreTranslate, configurabile via application.yml */
    @Value("${libretranslate.url:http://localhost:5000}")
    private String libreTranslateUrl;

    /**
     * API key opzionale (necessaria solo se LibreTranslate è avviato con --api-keys).
     * Self-hosted senza flag → lasciare vuoto.
     */
    @Value("${libretranslate.api-key:}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ──────────────────────────────────────────────────────────────────────────
    // DTO interni (request / response LibreTranslate)
    // ──────────────────────────────────────────────────────────────────────────

    /** Body inviato all'endpoint POST /translate di LibreTranslate */
    record TraduzioneRequest(String q, String source, String target, String format, String api_key) {}

    /** Body ricevuto da LibreTranslate (campi extra vengono ignorati) */
    @JsonIgnoreProperties(ignoreUnknown = true)
    record TraduzioneResponse(String translatedText) {}

    // ──────────────────────────────────────────────────────────────────────────
    // Metodo principale
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Traduce un singolo testo usando LibreTranslate.
     *
     * @param testo   Il testo da tradurre (sorgente: italiano "it")
     * @param lingua  Codice lingua target (es. "en", "fr", "de", "es")
     * @return        Il testo tradotto, oppure {@code null} in caso di errore
     */
    public String traduci(String testo, String lingua) {
        if (testo == null || testo.isBlank()) {
            return testo;
        }
        // LibreTranslate non ha bisogno di normalizzazione speciale —
        // gestisce correttamente spazi e caratteri Unicode.
        try {
            TraduzioneRequest reqBody = new TraduzioneRequest(
                testo,
                "it", // sorgente fisso: italiano
                lingua,
                "text",
                apiKey.isBlank() ? null : apiKey
            );

            String json = objectMapper.writeValueAsString(reqBody);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(libreTranslateUrl + "/translate"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(10))
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("LibreTranslate ha risposto con status {} per lingua={}", response.statusCode(), lingua);
                return null;
            }

            TraduzioneResponse resp = objectMapper.readValue(response.body(), TraduzioneResponse.class);
            return resp.translatedText();
        } catch (IOException | InterruptedException e) {
            log.error("Errore chiamata LibreTranslate (lingua={}): {}", lingua, e.getMessage());
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            return null;
        }
    }

    /**
     * Controlla se LibreTranslate è raggiungibile.
     * Utile per health check / diagnostica.
     *
     * @return {@code true} se risponde con status 200 all'endpoint /languages
     */
    public boolean isDisponibile() {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(libreTranslateUrl + "/languages"))
                .GET()
                .timeout(Duration.ofSeconds(3))
                .build();
            HttpResponse<Void> resp = httpClient.send(req, HttpResponse.BodyHandlers.discarding());
            return resp.statusCode() == 200;
        } catch (Exception e) {
            log.warn("LibreTranslate non raggiungibile: {}", e.getMessage());
            return false;
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Metodo di supporto: traduzione batch (usato internamente dal Resource)
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Traduce una lista di testi nella stessa lingua target.
     * Usa l'endpoint batch /translate di LibreTranslate (q = array di stringhe).
     *
     * @param testi   Lista di testi da tradurre
     * @param lingua  Lingua target
     * @return        Mappa { testoOriginale → traduzione }; le voci fallite sono omesse
     */
    public Map<String, String> traduciBatch(java.util.List<String> testi, String lingua) {
        Map<String, String> risultati = new java.util.LinkedHashMap<>();
        if (testi == null || testi.isEmpty()) return risultati;

        // LibreTranslate supporta array di stringhe nel campo "q"
        try {
            // Build body manuale con q come array
            StringBuilder sb = new StringBuilder("{\"q\":[");
            for (int i = 0; i < testi.size(); i++) {
                sb.append(objectMapper.writeValueAsString(testi.get(i)));
                if (i < testi.size() - 1) sb.append(',');
            }
            sb.append("],\"source\":\"it\",\"target\":\"").append(lingua).append("\",\"format\":\"text\"");
            if (!apiKey.isBlank()) {
                sb.append(",\"api_key\":\"").append(apiKey).append("\"");
            }
            sb.append("}");

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(libreTranslateUrl + "/translate"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(sb.toString()))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("LibreTranslate batch ha risposto con status {}", response.statusCode());
                // Fallback: traduci uno alla volta
                for (String t : testi) {
                    String tr = traduci(t, lingua);
                    if (tr != null) risultati.put(t, tr);
                }
                return risultati;
            }

            // LibreTranslate risponde con array di oggetti { translatedText }
            com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(response.body());
            if (root.isArray()) {
                for (int i = 0; i < testi.size() && i < root.size(); i++) {
                    String tr = root.get(i).path("translatedText").asText(null);
                    if (tr != null && !tr.isBlank()) {
                        risultati.put(testi.get(i), tr);
                    }
                }
            } else {
                // Risposta singola (succede se la lista aveva 1 elemento)
                String tr = root.path("translatedText").asText(null);
                if (tr != null && !tr.isBlank() && !testi.isEmpty()) {
                    risultati.put(testi.get(0), tr);
                }
            }
        } catch (IOException | InterruptedException e) {
            log.error("Errore batch LibreTranslate (lingua={}): {}", lingua, e.getMessage());
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
        }
        return risultati;
    }
}
