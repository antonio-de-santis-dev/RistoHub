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
 * per non bloccare la risposta HTTP. DOPO IL COMMIT della transazione, viene scatenato
 * un thread asincrono (TraduzioneAsyncService) che traduce tutti i prodotti del menu
 * in background. Le traduzioni compaiono nel menu quando l'utente ricarica la pagina.
 *
 * NOTA TECNICA: la traduzione async viene registrata come afterCommit() perché il thread
 * async deve poter VEDERE i prodotti nel DB. Se partisse prima del commit, la query
 * findProdottiSenzaTraduzioniByMenuId non troverebbe i prodotti appena inseriti.
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
     * poi scatena traduciMenuCompletoAsync() DOPO IL COMMIT per tradurre in background.
     *
     * @param file   file PDF caricato
     * @param menuId UUID del menu in cui inserire i prodotti
     * @return struttura con prodotti inseriti e avvisi
     */
    @Caching(evict = { @CacheEvict(value = "menuCompleto", key = "#menuId"), @CacheEvict(value = "piattiGiorno", key = "#menuId") })
    public PdfImportResultDTO importaPdf(MultipartFile file, UUID menuId) throws IOException {
        // Verifica che il menu appartenga all'utente corrente
        menuService.checkOwnership(menuId);

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
                    dto.setNome(pulisciTesto(pi.getNome()));
                    String descPulita = pulisciTesto(pi.getDescrizione());
                    dto.setDescrizione(descPulita != null && !descPulita.isBlank() ? descPulita : null);
                    dto.setPrezzo(parsePrezzo(pi.getPrezzo()));

                    PortataDTO portataRef = new PortataDTO();
                    portataRef.setId(portataId);
                    dto.setPortata(portataRef);

                    // Salva in italiano SENZA chiamare DeepL (sarebbe ~2s per prodotto).
                    // Tradurremo tutto in batch DOPO IL COMMIT (vedi sotto).
                    prodottoService.saveSenzaTraduzioni(dto);
                    inseriti++;
                } catch (Exception e) {
                    LOG.warn("Errore durante il salvataggio del prodotto '{}': {}", pi.getNome(), e.getMessage());
                    avvisi.add("Prodotto ignorato per errore: \"" + pi.getNome() + "\" — " + e.getMessage());
                }
            }
        }

        // ✨ TRADUZIONE ASYNC — DOPO IL COMMIT DELLA TRANSAZIONE
        //
        // PERCHÉ afterCommit() e non subito?
        // Il thread async chiama findProdottiSenzaTraduzioniByMenuId() che fa una
        // SELECT sul DB. Se il thread partisse ORA, i prodotti appena inseriti
        // NON sarebbero ancora visibili nel DB (la transazione @Transactional non
        // è ancora committata) e la query restituirebbe lista vuota → 0 traduzioni.
        //
        // Registrando afterCommit(), il thread parte SOLO DOPO che Spring ha fatto
        // il COMMIT. A quel punto i prodotti sono nel DB e la query li trova tutti.
        final int prodottiInseriti = inseriti;
        if (prodottiInseriti > 0) {
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            LOG.info("Import PDF committato: {} prodotti. Avvio traduzione async in background...", prodottiInseriti);
                            evictMenuCaches(menuId);
                            traduzioneAsyncService.traduciMenuCompletoAsync(menuId);
                        }
                    }
                );
            } else {
                // Fallback: se la sincronizzazione non è attiva, proviamo comunque
                LOG.warn("TransactionSynchronization non attiva — avvio traduzione async come fallback");
                evictMenuCaches(menuId);
                traduzioneAsyncService.traduciMenuCompletoAsync(menuId);
            }
        }

        return new PdfImportResultDTO(parsed.getPortate(), inseriti, avvisi);
    }

    // ── Helpers di parsing ────────────────────────────────────────────────────

    /**
     * Normalizza una stringa estratta da PDF rimuovendo caratteri invisibili Unicode.
     */
    private static String pulisciTesto(String s) {
        if (s == null) return null;
        String pulito = s
            .replace('\u00A0', ' ')
            .replace('\u202F', ' ')
            .replace('\u2007', ' ')
            .replace('\u2060', ' ')
            .replaceAll("[\\u200B-\\u200F\\u2028\\u2029\\uFEFF\\u00AD]", "")
            .replaceAll("\\s+", " ");
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

            if (rigaTrim.isBlank() || rigaTrim.startsWith("#")) continue;

            if (rigaTrim.toUpperCase().startsWith("PORTATA:")) {
                if (portataCorrente != null && !prodottiCorrenti.isEmpty()) {
                    portate.add(new PortataImportDTO(portataCorrente, new ArrayList<>(prodottiCorrenti)));
                    totaleProdotti += prodottiCorrenti.size();
                }
                portataCorrente = pulisciTesto(rigaTrim.substring("PORTATA:".length()));
                prodottiCorrenti = new ArrayList<>();
                continue;
            }

            if (portataCorrente != null && rigaTrim.startsWith("- ")) {
                String contenuto = rigaTrim.substring(2).trim();
                String[] parti = contenuto.split("\\|", -1);
                if (parti.length >= 1) {
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

        if (portataCorrente != null && !prodottiCorrenti.isEmpty()) {
            portate.add(new PortataImportDTO(portataCorrente, new ArrayList<>(prodottiCorrenti)));
            totaleProdotti += prodottiCorrenti.size();
        }

        return new PdfImportResultDTO(portate, totaleProdotti, avvisi);
    }

    private boolean nomeCorreisponde(String nomePdf, main.domain.Portata portata) {
        String n = nomePdf.trim();
        String nNorm = n.toUpperCase().replace(" ", "_");
        if (portata.getNomeDefault() != null && portata.getNomeDefault().name().equalsIgnoreCase(nNorm)) return true;
        if (portata.getNomePersonalizzato() != null && portata.getNomePersonalizzato().equalsIgnoreCase(n)) return true;
        return false;
    }

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

    private void evictMenuCaches(UUID menuId) {
        Cache menuCompleto = cacheManager.getCache("menuCompleto");
        if (menuCompleto != null) menuCompleto.evict(menuId);
        Cache piattiGiorno = cacheManager.getCache("piattiGiorno");
        if (piattiGiorno != null) piattiGiorno.evict(menuId);
        LOG.debug("Cache invalidate per menu {} dopo commit import PDF", menuId);
    }
}
