package main.service;

import com.deepl.api.DeepLException;
import com.deepl.api.TextResult;
import com.deepl.api.Translator;
import com.deepl.api.TranslatorOptions;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import main.config.ApplicationProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service di traduzione automatica tramite DeepL API.
 *
 * Viene chiamato dai service di Prodotto, Portata e PiattoDelGiorno ogni volta
 * che un'entità con campi traducibili viene salvata o aggiornata. Le traduzioni
 * vengono serializzate in JSON e persistite nella colonna "traduzioni" dell'entità,
 * così da essere disponibili istantaneamente al caricamento del menu pubblico
 * (senza chiamate API runtime lato client).
 *
 * Lingue supportate: EN (inglese), FR (francese), DE (tedesco), ES (spagnolo).
 * La lingua sorgente è sempre IT (italiano).
 *
 * Se la DeepL API key non è configurata o è vuota, il service diventa un no-op
 * silenzioso: buildTraduzioniJson() ritorna null, e il frontend userà il fallback
 * italiano. Questo permette di far girare l'app anche in dev senza DeepL configurato.
 */
@Service
public class TraduzioneDeepLService {

    private static final Logger LOG = LoggerFactory.getLogger(TraduzioneDeepLService.class);

    /** Lingue di destinazione. Codici DeepL (EN-US per inglese americano, gli altri sono standard). */
    public static final List<String> LINGUE_TARGET = Arrays.asList("EN-US", "FR", "DE", "ES");

    /** Lingue esposte lato frontend (senza suffisso paese). */
    private static final Map<String, String> MAP_DEEPL_TO_FRONTEND = Map.of("EN-US", "en", "FR", "fr", "DE", "de", "ES", "es");

    private final ApplicationProperties applicationProperties;
    private final ObjectMapper objectMapper;
    private Translator translator;
    private boolean attivo = false;

    public TraduzioneDeepLService(ApplicationProperties applicationProperties, ObjectMapper objectMapper) {
        this.applicationProperties = applicationProperties;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        ApplicationProperties.Deepl cfg = applicationProperties.getDeepl();
        if (cfg == null || !Boolean.TRUE.equals(cfg.getEnabled())) {
            LOG.info("DeepL disabilitato via configurazione (application.deepl.enabled=false). Traduzioni non saranno generate.");
            return;
        }
        if (cfg.getApiKey() == null || cfg.getApiKey().isBlank()) {
            LOG.warn(
                "DeepL API key non configurata. Le traduzioni automatiche saranno disattivate. " +
                "Configura application.deepl.api-key o la variabile d'ambiente DEEPL_API_KEY."
            );
            return;
        }
        try {
            TranslatorOptions options = new TranslatorOptions().setTimeout(Duration.ofSeconds(cfg.getTimeoutSeconds()));
            this.translator = new Translator(cfg.getApiKey(), options);
            this.attivo = true;
            LOG.info("DeepL Translator inizializzato correttamente.");
        } catch (Exception e) {
            LOG.error("Errore inizializzazione DeepL Translator: {}", e.getMessage());
            this.attivo = false;
        }
    }

    /**
     * Costruisce il JSON delle traduzioni per un'entità con due soli campi traducibili:
     * {@code nome} e {@code descrizione}. Tipico per Prodotto e PiattoDelGiorno.
     *
     * <p>Formato di output (serializzato come stringa JSON):
     * <pre>
     * {
     *   "en": { "nome": "Spaghetti Carbonara", "descrizione": "Pasta with egg, pancetta..." },
     *   "fr": { "nome": "Spaghetti Carbonara", "descrizione": "Pâtes aux œufs..." },
     *   "de": { ... },
     *   "es": { ... }
     * }
     * </pre>
     *
     * @param nome il nome in italiano (può essere null)
     * @param descrizione la descrizione in italiano (può essere null)
     * @return stringa JSON con le traduzioni, oppure null se DeepL non è attivo
     *         o se entrambi i campi sono vuoti
     */
    public String buildTraduzioniJson(String nome, String descrizione) {
        if (!attivo) return null;
        Map<String, String> campi = new LinkedHashMap<>();
        if (nome != null && !nome.isBlank()) campi.put("nome", nome);
        if (descrizione != null && !descrizione.isBlank()) campi.put("descrizione", descrizione);
        if (campi.isEmpty()) return null;
        return buildTraduzioniJson(campi);
    }

    /**
     * Versione generica: accetta una mappa {campo → testoItaliano} e restituisce
     * il JSON {lingua → {campo → testoTradotto}} per tutte le lingue target.
     *
     * Usa una singola chiamata batch per ogni lingua (DeepL accetta array di testi),
     * quindi il costo totale è 4 chiamate HTTP (una per EN, FR, DE, ES).
     *
     * @param campiItaliano mappa dei campi in italiano (es. {"nome":"...", "descrizione":"..."})
     * @return JSON serializzato, null su errore o se DeepL non è attivo
     */
    public String buildTraduzioniJson(Map<String, String> campiItaliano) {
        if (!attivo || campiItaliano == null || campiItaliano.isEmpty()) return null;

        // Estraiamo la lista ordinata dei testi da tradurre
        List<String> campiOrdinati = new ArrayList<>(campiItaliano.keySet());
        List<String> testiIt = new ArrayList<>();
        for (String k : campiOrdinati) testiIt.add(campiItaliano.get(k));

        Map<String, Map<String, String>> risultato = new LinkedHashMap<>();

        for (String linguaDeepL : LINGUE_TARGET) {
            try {
                List<TextResult> results = translator.translateText(testiIt, "IT", linguaDeepL);
                if (results == null || results.size() != campiOrdinati.size()) {
                    LOG.warn("DeepL ha restituito un numero di risultati inatteso per lingua {}", linguaDeepL);
                    continue;
                }
                Map<String, String> perLingua = new LinkedHashMap<>();
                for (int i = 0; i < campiOrdinati.size(); i++) {
                    perLingua.put(campiOrdinati.get(i), results.get(i).getText());
                }
                String codiceFrontend = MAP_DEEPL_TO_FRONTEND.get(linguaDeepL);
                risultato.put(codiceFrontend, perLingua);
            } catch (DeepLException e) {
                LOG.error("Errore DeepL per lingua {}: {}", linguaDeepL, e.getMessage());
                // Prosegue con le altre lingue, non abbiamo retry — il fallback lato frontend è l'italiano
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                LOG.error("Interruzione durante traduzione DeepL per lingua {}", linguaDeepL);
                return null;
            }
        }

        if (risultato.isEmpty()) return null;

        try {
            return objectMapper.writeValueAsString(risultato);
        } catch (Exception e) {
            LOG.error("Errore serializzazione JSON traduzioni: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Utility per il frontend: verifica se una stringa JSON di traduzioni contiene
     * effettivamente dati validi. Usato dal controller per decidere se rigenerarle.
     */
    public boolean isTraduzioniJsonVuoto(String json) {
        if (json == null || json.isBlank()) return true;
        try {
            Map<String, Map<String, String>> parsed = objectMapper.readValue(
                json,
                new TypeReference<Map<String, Map<String, String>>>() {}
            );
            return parsed == null || parsed.isEmpty();
        } catch (Exception e) {
            return true;
        }
    }

    public boolean isAttivo() {
        return attivo;
    }

    /** Utility per leggere il JSON delle traduzioni (usato dal frontend di fallback). */
    public Map<String, Map<String, String>> parseTraduzioniJson(String json) {
        if (json == null || json.isBlank()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Map<String, String>>>() {});
        } catch (Exception e) {
            LOG.warn("Errore parsing JSON traduzioni: {}", e.getMessage());
            return new HashMap<>();
        }
    }
}
