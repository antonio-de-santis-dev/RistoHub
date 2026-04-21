package main.service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.repository.PortataRepository;
import main.service.dto.PdfImportResultDTO;
import main.service.dto.PdfImportResultDTO.PortataImportDTO;
import main.service.dto.PdfImportResultDTO.ProdottoImportDTO;
import main.service.dto.PortataDTO;
import main.service.dto.ProdottoDTO;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service per il parsing di PDF di importazione menu e la creazione bulk dei prodotti.
 *
 * Formato atteso nel PDF (generato dal template Word allegato):
 *
 *   PORTATA: Antipasto
 *   - Bruschetta al pomodoro | Con pomodorini freschi | 6.00
 *   - Tagliere di salumi | Selezione di salumi locali | 12.00
 *
 *   PORTATA: Primo
 *   - Orecchiette alle cime di rapa | | 10.00
 *
 * Regole di parsing:
 *   • La riga che inizia con "PORTATA:" (case-insensitive) identifica la sezione
 *   • Le righe prodotto iniziano con "- " e contengono 3 campi separati da "|"
 *     [nome] | [descrizione (può essere vuota)] | [prezzo]
 *   • Righe vuote e righe di istruzione (iniziano con "#") vengono ignorate
 *   • Il prezzo viene normalizzato: virgola → punto, simbolo "€" rimosso
 *
 * TRADUZIONE: i prodotti vengono salvati SENZA traduzioni (via saveSenzaTraduzioni)
 * per non bloccare la risposta HTTP. Dopo il salvataggio, viene scatenato un thread
 * asincrono (TraduzioneAsyncService) che traduce tutti i prodotti del menu in background.
 * Le traduzioni compaiono nel menu quando l'utente ricarica la pagina (15-60 secondi dopo).
 *
 * Libreria: Apache PDFBox 3.x
 */
@Service
@Transactional
public class PdfImportService {

    private static final Logger LOG = LoggerFactory.getLogger(PdfImportService.class);

    private final PortataRepository portataRepository;
    private final ProdottoService prodottoService;
    private final MenuService menuService;
    private final CacheManager cacheManager;
    private final TraduzioneAsyncService traduzioneAsyncService;

    public PdfImportService(
        PortataRepository portataRepository,
        ProdottoService prodottoService,
        MenuService menuService,
        CacheManager cacheManager,
        TraduzioneAsyncService traduzioneAsyncService
    ) {
        this.portataRepository = portataRepository;
        this.prodottoService = prodottoService;
        this.menuService = menuService;
        this.cacheManager = cacheManager;
        this.traduzioneAsyncService = traduzioneAsyncService;
    }

    // ── STEP 1: parsing (solo analisi, nessuna scrittura su DB) ─────────────

    /**
     * Analizza il PDF e restituisce la struttura estratta senza salvare nulla.
     * Usato per la preview "anteprima" nel frontend prima della conferma.
     */
    public PdfImportResultDTO analizzaPdf(MultipartFile file) throws IOException {
        String testo = estraiTesto(file.getInputStream());
        return parseTesto(testo);
    }

    // ── STEP 2: import effettivo su DB ────────────────────────────────────────

    /**
     * Analizza il PDF e salva i prodotti trovati nelle portate del menu specificato.
     *
     * Strategia di matching portata:
     *   Il nome estratto dal PDF viene confrontato (case-insensitive, trim) con
     *   getNomeDefault() oppure getNomePersonalizzato() di ogni portata del menu.
     *   Se non trovata, la portata viene ignorata e aggiunta agli avvisi.
     *
     * TRADUZIONE: usa saveSenzaTraduzioni() per salvare velocemente in italiano,
     * poi scatena traduciMenuCompletoAsync() per tradurre tutto in background.
     *
     * @param file   file PDF caricato
     * @param menuId UUID del menu in cui inserire i prodotti
     * @return struttura con prodotti inseriti e avvisi
     */
    @Caching(evict = { @CacheEvict(value = "menuCompleto", key = "#menuId"), @CacheEvict(value = "piattiGiorno", key = "#menuId") })
    public PdfImportResultDTO importaPdf(MultipartFile file, UUID menuId) throws IOException {
        // Verifica che il menu appartenga all'utente corrente
        menuService.checkOwnership(menuId);

        // Registra l'invalidazione della cache DOPO il commit della transazione.
        // Se invalidassimo prima, una richiesta concorrente (o la successiva GET /full)
        // potrebbe rileggere i dati pre-commit e ripopolare la cache con stato obsoleto.
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        evictMenuCaches(menuId);
                    }
                }
            );
        } else {
            // Fallback se la transazione non è attiva (non dovrebbe succedere con @Transactional)
            evictMenuCaches(menuId);
        }

        String testo = estraiTesto(file.getInputStream());
        PdfImportResultDTO parsed = parseTesto(testo);

        // Carica tutte le portate del menu (ordinate per tipo/nomeDefault)
        List<main.domain.Portata> portateMenu = portataRepository.findByMenuIdOrdered(menuId);

        List<String> avvisi = new ArrayList<>(parsed.getAvvisi());
        int inseriti = 0;

        for (PortataImportDTO portataImport : parsed.getPortate()) {
            // Match portata per nome
            Optional<main.domain.Portata> portataMatch = portateMenu
                .stream()
                .filter(p -> nomeCorreisponde(portataImport.getNomePortata(), p))
                .findFirst();

            if (portataMatch.isEmpty()) {
                avvisi.add("Portata non trovata nel menu: \"" + portataImport.getNomePortata() + "\" — prodotti ignorati.");
                continue;
            }

            UUID portataId = portataMatch.get().getId();

            for (ProdottoImportDTO pi : portataImport.getProdotti()) {
                try {
                    ProdottoDTO dto = new ProdottoDTO();
                    // Doppia pulizia: anche se parseTesto già normalizza, la applichiamo
                    // di nuovo per proteggerci da eventuali modifiche future al flusso.
                    dto.setNome(pulisciTesto(pi.getNome()));
                    String descPulita = pulisciTesto(pi.getDescrizione());
                    dto.setDescrizione(descPulita != null && !descPulita.isBlank() ? descPulita : null);
                    dto.setPrezzo(parsePrezzo(pi.getPrezzo()));

                    PortataDTO portataRef = new PortataDTO();
                    portataRef.setId(portataId);
                    dto.setPortata(portataRef);

                    // Salva in italiano SENZA chiamare DeepL (sarebbe ~2s per prodotto).
                    // Tradurremo tutto in batch dopo il ciclo.
                    prodottoService.saveSenzaTraduzioni(dto);
                    inseriti++;
                } catch (Exception e) {
                    LOG.warn("Errore durante il salvataggio del prodotto '{}': {}", pi.getNome(), e.getMessage());
                    avvisi.add("Prodotto ignorato per errore: \"" + pi.getNome() + "\" — " + e.getMessage());
                }
            }
        }

        // ✨ BATCH ASYNC: ora che i prodotti sono salvati velocemente in italiano,
        // scateniamo un thread separato che traduce tutto in EN/FR/DE/ES via DeepL.
        // Il client riceve la risposta subito. Le traduzioni arrivano in 30-60 secondi.
        // L'utente ricarica il menu e le vede apparire progressivamente.
        if (inseriti > 0) {
            LOG.info("Import PDF completato: {} prodotti salvati. Avvio traduzione async in background...", inseriti);
            traduzioneAsyncService.traduciMenuCompletoAsync(menuId);
        }

        return new PdfImportResultDTO(parsed.getPortate(), inseriti, avvisi);
    }

    // ── Helpers di parsing ────────────────────────────────────────────────────

    /**
     * Normalizza una stringa estratta da PDF rimuovendo caratteri invisibili Unicode
     * che PDFBox può preservare e che rompono:
     *   • il confronto di uguaglianza tra stringhe
     *   • le API di traduzione esterne (mymemory) che non li gestiscono
     *   • la visualizzazione coerente nel frontend
     *
     * Gestisce:
     *   • NBSP (\u00A0), narrow NBSP (\u202F), figure space (\u2007)
     *   • zero-width space (\u200B), LRM/RLM (\u200E/F), line/paragraph separator
     *   • BOM (\uFEFF)
     *   • spazi multipli consecutivi
     *
     * NB: usa String.strip() (non trim()) perché trim() rimuove SOLO caratteri ≤ U+0020,
     *     mentre strip() rimuove tutti gli spazi Unicode.
     */
    private static String pulisciTesto(String s) {
        if (s == null) return null;
        String pulito = s
            .replace('\u00A0', ' ') // NBSP
            .replace('\u202F', ' ') // narrow NBSP
            .replace('\u2007', ' ') // figure space
            .replace('\u2060', ' ') // word joiner
            .replaceAll("[\\u200B-\\u200F\\u2028\\u2029\\uFEFF\\u00AD]", "") // zero-width + soft hyphen
            .replaceAll("\\s+", " "); // collassa whitespace multipli
        return pulito.strip();
    }

    private String estraiTesto(InputStream inputStream) throws IOException {
        try (PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        }
    }

    private PdfImportResultDTO parseTesto(String testo) {
        List<PortataImportDTO> portate = new ArrayList<>();
        List<String> avvisi = new ArrayList<>();
        int totaleProdotti = 0;

        String portataCorrente = null;
        List<ProdottoImportDTO> prodottiCorrenti = new ArrayList<>();

        for (String riga : testo.split("\\r?\\n")) {
            String rigaTrim = riga.trim();

            // Ignora righe vuote e commenti/istruzioni
            if (rigaTrim.isBlank() || rigaTrim.startsWith("#")) continue;

            // Riconosce intestazione portata
            if (rigaTrim.toUpperCase().startsWith("PORTATA:")) {
                // Salva la portata precedente (se presente)
                if (portataCorrente != null && !prodottiCorrenti.isEmpty()) {
                    portate.add(new PortataImportDTO(portataCorrente, new ArrayList<>(prodottiCorrenti)));
                    totaleProdotti += prodottiCorrenti.size();
                }
                portataCorrente = pulisciTesto(rigaTrim.substring("PORTATA:".length()));
                prodottiCorrenti = new ArrayList<>();
                continue;
            }

            // Riga prodotto: inizia con "- "
            if (portataCorrente != null && rigaTrim.startsWith("- ")) {
                String contenuto = rigaTrim.substring(2).trim();
                String[] parti = contenuto.split("\\|", -1);
                if (parti.length >= 1) {
                    // pulisciTesto rimuove caratteri Unicode invisibili (NBSP ecc.)
                    // che romperebbero la traduzione lato frontend.
                    String nome = pulisciTesto(parti[0]);
                    String descrizione = parti.length >= 2 ? pulisciTesto(parti[1]) : "";
                    String prezzo = parti.length >= 3 ? pulisciTesto(parti[2]) : "0";
                    if (nome != null && !nome.isBlank()) {
                        prodottiCorrenti.add(new ProdottoImportDTO(nome, descrizione, prezzo));
                    }
                } else {
                    avvisi.add("Riga non riconosciuta: " + rigaTrim);
                }
            }
        }

        // Ultima portata
        if (portataCorrente != null && !prodottiCorrenti.isEmpty()) {
            portate.add(new PortataImportDTO(portataCorrente, new ArrayList<>(prodottiCorrenti)));
            totaleProdotti += prodottiCorrenti.size();
        }

        return new PdfImportResultDTO(portate, totaleProdotti, avvisi);
    }

    /**
     * Verifica se il nome estratto dal PDF corrisponde a una portata del menu.
     * Confronto case-insensitive su nomeDefault (enum) o nomePersonalizzato.
     */
    private boolean nomeCorreisponde(String nomePdf, main.domain.Portata portata) {
        String n = nomePdf.trim();
        // Normalizza: "Vino Rosso" → "VINO_ROSSO"
        String nNorm = n.toUpperCase().replace(" ", "_");
        if (portata.getNomeDefault() != null && portata.getNomeDefault().name().equalsIgnoreCase(nNorm)) return true;
        if (portata.getNomePersonalizzato() != null && portata.getNomePersonalizzato().equalsIgnoreCase(n)) return true;
        return false;
    }

    /**
     * Normalizza il prezzo: rimuove "€", sostituisce virgola con punto, fa il parse.
     * In caso di errore ritorna BigDecimal.ZERO.
     */
    private BigDecimal parsePrezzo(String prezzoStr) {
        if (prezzoStr == null || prezzoStr.isBlank()) return BigDecimal.ZERO;
        try {
            String cleaned = prezzoStr.replace("€", "").replace(",", ".").trim();
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            LOG.warn("Prezzo non parsabile: '{}' — impostato a 0", prezzoStr);
            return BigDecimal.ZERO;
        }
    }

    /**
     * Svuota le cache relative al menu. Chiamato DOPO il commit della transazione
     * per evitare che richieste concorrenti ripopolino la cache con dati pre-commit.
     */
    private void evictMenuCaches(UUID menuId) {
        Cache menuCompleto = cacheManager.getCache("menuCompleto");
        if (menuCompleto != null) menuCompleto.evict(menuId);
        Cache piattiGiorno = cacheManager.getCache("piattiGiorno");
        if (piattiGiorno != null) piattiGiorno.evict(menuId);
        LOG.debug("Cache invalidate per menu {} dopo commit import PDF", menuId);
    }
}
