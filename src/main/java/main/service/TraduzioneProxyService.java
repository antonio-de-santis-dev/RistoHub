package main.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Servizio proxy verso LibreTranslate — versione ottimizzata.
 *
 * OTTIMIZZAZIONI rispetto alla versione precedente:
 * ──────────────────────────────────────────────────
 *
 * OPT-1 (VELOCITÀ): Chunking parallelo con CompletableFuture.
 *   Invece di inviare tutto in un unico batch o fare richieste sequenziali,
 *   dividiamo i testi in chunk da MAX_CHUNK_SIZE e li inviamo IN PARALLELO.
 *   Esempio: 60 testi → 3 chunk da 20 → 3 chiamate HTTP in parallelo → ~2s
 *   (invece di ~9s con 3 chiamate sequenziali).
 *
 * OPT-2 (AFFIDABILITÀ): Fix bug api_key null.
 *   Il body viene costruito con Map<String,Object>: il campo api_key viene
 *   incluso SOLO se valorizzato. Con il vecchio record Java, "api_key": null
 *   causava HTTP 400 da LibreTranslate → alcuni/tutti i prodotti non tradotti.
 *
 * OPT-3 (AFFIDABILITÀ): Parsing difensivo della risposta batch.
 *   Gestisce tutti i formati di risposta di LibreTranslate:
 *   array standard, oggetto con array interno, oggetto singolo.
 *
 * OPT-4 (AFFIDABILITÀ): Fallback singolo con stessa correzione api_key.
 *   Se un chunk fallisce, le sue stringhe vengono ritradotte una a una.
 *
 * OPT-5 (AFFIDABILITÀ): Timeout aumentati.
 *   connectTimeout: 5s → 10s  |  chunk batch: 20s → 45s  |  singolo: 10s → 15s
 */
@Service
public class TraduzioneProxyService {

    private static final Logger log = LoggerFactory.getLogger(TraduzioneProxyService.class);

    /** Numero di testi per ogni chunk inviato a LibreTranslate */
    private static final int MAX_CHUNK_SIZE = 25;

    /** Numero massimo di chunk inviati in parallelo */
    private static final int MAX_PARALLEL_CHUNKS = 4;

    @Value("${libretranslate.url:http://localhost:5000}")
    private String libreTranslateUrl;

    @Value("${libretranslate.api-key:}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Pool di thread dedicato per le chiamate parallele a LibreTranslate
    private final ExecutorService executor = Executors.newFixedThreadPool(MAX_PARALLEL_CHUNKS);

    // ─────────────────────────────────────────────────────────────────────────
    // Metodo pubblico: batch parallelo
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Traduce una lista di testi nella lingua target usando chiamate parallele.
     *
     * Flusso:
     *  1. Divide i testi in chunk da MAX_CHUNK_SIZE
     *  2. Invia tutti i chunk a LibreTranslate IN PARALLELO (CompletableFuture)
     *  3. Raccoglie e unisce i risultati
     *  4. Per i chunk falliti → fallback con richieste singole
     *
     * @param testi   Lista di testi da tradurre (sorgente: italiano)
     * @param lingua  Codice lingua target (es. "en", "fr", "de", "es")
     * @return        Mappa { testoOriginale → traduzione }
     */
    public Map<String, String> traduciBatch(List<String> testi, String lingua) {
        Map<String, String> risultati = new LinkedHashMap<>();
        if (testi == null || testi.isEmpty()) return risultati;

        List<List<String>> chunks = partiziona(testi, MAX_CHUNK_SIZE);
        log.debug("Traduzione batch: {} testi → {} chunk paralleli → lingua={}", testi.size(), chunks.size(), lingua);

        // Lancia tutte le chiamate in parallelo
        List<CompletableFuture<Map<String, String>>> futures = chunks
            .stream()
            .map(chunk -> CompletableFuture.supplyAsync(() -> traduciChunk(chunk, lingua), executor))
            .collect(Collectors.toList());

        // Attende e raccoglie tutti i risultati
        for (CompletableFuture<Map<String, String>> future : futures) {
            try {
                risultati.putAll(future.get());
            } catch (Exception e) {
                log.warn("Un chunk parallelo ha sollevato eccezione: {}", e.getMessage());
            }
        }

        log.debug("Traduzione completata: {}/{} testi tradotti", risultati.size(), testi.size());
        return risultati;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Health check
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Controlla se LibreTranslate è raggiungibile.
     *
     * @return {@code true} se risponde con status 200 all'endpoint /languages
     */
    public boolean isDisponibile() {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(libreTranslateUrl + "/languages"))
                .GET()
                .timeout(Duration.ofSeconds(5))
                .build();
            HttpResponse<Void> resp = httpClient.send(req, HttpResponse.BodyHandlers.discarding());
            return resp.statusCode() == 200;
        } catch (Exception e) {
            log.warn("LibreTranslate non raggiungibile: {}", e.getMessage());
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Implementazioni interne
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Traduce un singolo chunk. Se fallisce → fallback con richieste singole.
     */
    private Map<String, String> traduciChunk(List<String> chunk, String lingua) {
        try {
            Map<String, String> risultato = inviaChunkALibreTranslate(chunk, lingua);
            if (!risultato.isEmpty()) return risultato;
            log.debug("Chunk batch vuoto per lingua={}, provo singoli per {} testi", lingua, chunk.size());
        } catch (Exception e) {
            log.warn("Chunk batch fallito (lingua={}): {}. Fallback singoli per {} testi.", lingua, e.getMessage(), chunk.size());
        }

        // Fallback: richieste singole per i testi di questo chunk
        Map<String, String> fallback = new LinkedHashMap<>();
        for (String testo : chunk) {
            String tr = traduciSingolo(testo, lingua);
            if (tr != null && !tr.isBlank()) {
                fallback.put(testo, tr);
            }
        }
        return fallback;
    }

    /**
     * Invia un chunk di testi a LibreTranslate come array JSON.
     *
     * FIX BUG CRITICO api_key:
     *   Body costruito con Map<String,Object> → api_key incluso SOLO se valorizzato.
     *   Con il vecchio record Java, "api_key": null era sempre nel JSON →
     *   LibreTranslate 1.9.x rispondeva HTTP 400 → zero traduzioni.
     */
    private Map<String, String> inviaChunkALibreTranslate(List<String> chunk, String lingua) throws IOException, InterruptedException {
        Map<String, Object> body = new HashMap<>();
        body.put("q", chunk);
        body.put("source", "it");
        body.put("target", lingua);
        body.put("format", "text");
        if (apiKey != null && !apiKey.isBlank()) {
            body.put("api_key", apiKey);
        }
        // api_key NON incluso se vuoto → nessun "api_key": null nel JSON

        String json = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(libreTranslateUrl + "/translate"))
            .header("Content-Type", "application/json")
            .timeout(Duration.ofSeconds(45))
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn(
                "LibreTranslate chunk → status={} body={}",
                response.statusCode(),
                response.body().length() > 300 ? response.body().substring(0, 300) : response.body()
            );
            return Map.of();
        }

        return parsaRispostaBatch(chunk, response.body());
    }

    /**
     * Parsing difensivo della risposta di LibreTranslate.
     * Gestisce tutti i formati possibili:
     *   - Array:           [{translatedText:"t1"}, {translatedText:"t2"}]
     *   - Oggetto+array:   {translatedText:["t1","t2"]}
     *   - Oggetto singolo: {translatedText:"t1"}
     */
    private Map<String, String> parsaRispostaBatch(List<String> chunk, String responseBody) throws IOException {
        Map<String, String> risultati = new LinkedHashMap<>();
        JsonNode root = objectMapper.readTree(responseBody);

        if (root.isArray()) {
            for (int i = 0; i < chunk.size() && i < root.size(); i++) {
                String tr = root.get(i).path("translatedText").asText(null);
                if (tr != null && !tr.isBlank()) {
                    risultati.put(chunk.get(i), tr);
                }
            }
        } else if (root.isObject()) {
            JsonNode ttNode = root.path("translatedText");
            if (ttNode.isArray()) {
                for (int i = 0; i < chunk.size() && i < ttNode.size(); i++) {
                    String tr = ttNode.get(i).asText(null);
                    if (tr != null && !tr.isBlank()) {
                        risultati.put(chunk.get(i), tr);
                    }
                }
            } else if (ttNode.isTextual() && chunk.size() == 1) {
                String tr = ttNode.asText(null);
                if (tr != null && !tr.isBlank()) {
                    risultati.put(chunk.get(0), tr);
                }
            } else {
                log.warn(
                    "Formato risposta LibreTranslate non riconosciuto: {}",
                    responseBody.substring(0, Math.min(300, responseBody.length()))
                );
            }
        }

        return risultati;
    }

    /**
     * Traduzione singola — fallback quando un chunk fallisce.
     * Stesso fix api_key: usa Map per evitare "api_key": null nel JSON.
     */
    private String traduciSingolo(String testo, String lingua) {
        if (testo == null || testo.isBlank()) return testo;
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("q", testo);
            body.put("source", "it");
            body.put("target", lingua);
            body.put("format", "text");
            if (apiKey != null && !apiKey.isBlank()) {
                body.put("api_key", apiKey);
            }

            String json = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(libreTranslateUrl + "/translate"))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("LibreTranslate singolo → status={} lingua={}", response.statusCode(), lingua);
                return null;
            }

            JsonNode root = objectMapper.readTree(response.body());
            String tradotto = root.path("translatedText").asText(null);
            return (tradotto != null && !tradotto.isBlank()) ? tradotto : null;
        } catch (IOException | InterruptedException e) {
            log.error("Errore LibreTranslate singolo (lingua={}): {}", lingua, e.getMessage());
            if (e instanceof InterruptedException) Thread.currentThread().interrupt();
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Utility
    // ─────────────────────────────────────────────────────────────────────────

    private static <T> List<List<T>> partiziona(List<T> lista, int size) {
        List<List<T>> partizioni = new ArrayList<>();
        for (int i = 0; i < lista.size(); i += size) {
            partizioni.add(lista.subList(i, Math.min(i + size, lista.size())));
        }
        return partizioni;
    }
}
