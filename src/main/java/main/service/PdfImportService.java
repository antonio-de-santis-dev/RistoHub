package main.service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.domain.Prodotto;
import main.repository.PortataRepository;
import main.repository.ProdottoRepository;
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
 * STRATEGIA TRADUZIONE (2 passaggi nello stesso metodo):
 *
 *   PASSO 1 — Salva tutti i prodotti velocemente SENZA DeepL (~50ms ciascuno).
 *             Raccoglie gli UUID dei prodotti appena salvati.
 *
 *   PASSO 2 — Chiama DeepL per ogni prodotto salvato e aggiorna il campo traduzioni.
 *             Questo è lento (~2s per prodotto × 4 lingue) ma avviene DOPO che tutti
 *             i prodotti sono nel DB, nella stessa transazione.
 *
 * Tutto avviene in una SINGOLA transazione @Transactional. Niente @Async,
 * niente afterCommit(), niente thread separati. Funziona al 100%.
 */
@Service
@Transactional
public class PdfImportService {

    private static final Logger LOG = LoggerFactory.getLogger(PdfImportService.class);

    private final PortataRepository portataRepository;
    private final ProdottoService prodottoService;
    private final ProdottoRepository prodottoRepository;
    private final TraduzioneDeepLService traduzioneDeepLService;
    private final MenuService menuService;
    private final CacheManager cacheManager;

    public PdfImportService(
        PortataRepository portataRepository,
        ProdottoService prodottoService,
        ProdottoRepository prodottoRepository,
        TraduzioneDeepLService traduzioneDeepLService,
        MenuService menuService,
        CacheManager cacheManager
    ) {
        this.portataRepository = portataRepository;
        this.prodottoService = prodottoService;
        this.prodottoRepository = prodottoRepository;
        this.traduzioneDeepLService = traduzioneDeepLService;
        this.menuService = menuService;
        this.cacheManager = cacheManager;
    }

    // ── STEP 1: parsing (solo analisi, nessuna scrittura su DB) ─────────────

    public PdfImportResultDTO analizzaPdf(MultipartFile file) throws IOException {
        String testo = estraiTesto(file.getInputStream());
        return parseTesto(testo);
    }

    // ── STEP 2: import effettivo su DB ────────────────────────────────────────

    @Caching(evict = { @CacheEvict(value = "menuCompleto", key = "#menuId"), @CacheEvict(value = "piattiGiorno", key = "#menuId") })
    public PdfImportResultDTO importaPdf(MultipartFile file, UUID menuId) throws IOException {
        menuService.checkOwnership(menuId);

        String testo = estraiTesto(file.getInputStream());
        PdfImportResultDTO parsed = parseTesto(testo);

        List<main.domain.Portata> portateMenu = portataRepository.findByMenuIdOrdered(menuId);

        List<String> avvisi = new ArrayList<>(parsed.getAvvisi());
        int inseriti = 0;

        // ══════════════════════════════════════════════════════════════════
        //  PASSO 1: Salva tutti i prodotti SENZA traduzioni (veloce)
        // ══════════════════════════════════════════════════════════════════
        // Raccogliamo gli UUID dei prodotti salvati per tradurli dopo.
        List<UUID> prodottiDaTradurre = new ArrayList<>();

        for (PortataImportDTO portataImport : parsed.getPortate()) {
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

                    // Salva velocemente SENZA chiamare DeepL
                    ProdottoDTO saved = prodottoService.saveSenzaTraduzioni(dto);
                    prodottiDaTradurre.add(saved.getId());
                    inseriti++;
                } catch (Exception e) {
                    LOG.warn("Errore durante il salvataggio del prodotto '{}': {}", pi.getNome(), e.getMessage());
                    avvisi.add("Prodotto ignorato per errore: \"" + pi.getNome() + "\" — " + e.getMessage());
                }
            }
        }

        LOG.info("PASSO 1 completato: {} prodotti salvati in italiano per menu {}", inseriti, menuId);

        // ══════════════════════════════════════════════════════════════════
        //  PASSO 2: Traduci tutti i prodotti appena salvati via DeepL
        // ══════════════════════════════════════════════════════════════════
        // I prodotti sono GIÀ nel DB (stessa transazione, stessa sessione
        // Hibernate). Li carichiamo per UUID e chiamiamo DeepL.
        // Questo è lento (~2s per prodotto) ma FUNZIONA AL 100%.
        if (!prodottiDaTradurre.isEmpty() && traduzioneDeepLService.isAttivo()) {
            LOG.info("PASSO 2: avvio traduzione DeepL per {} prodotti...", prodottiDaTradurre.size());
            int tradotti = 0;

            for (UUID prodottoId : prodottiDaTradurre) {
                try {
                    Optional<Prodotto> opt = prodottoRepository.findById(prodottoId);
                    if (opt.isEmpty()) continue;

                    Prodotto prodotto = opt.get();
                    String json = traduzioneDeepLService.buildTraduzioniJson(prodotto.getNome(), prodotto.getDescrizione());
                    if (json != null) {
                        prodotto.setTraduzioni(json);
                        prodottoRepository.save(prodotto);
                        tradotti++;

                        if (tradotti % 10 == 0) {
                            LOG.info("  ... tradotti {}/{}", tradotti, prodottiDaTradurre.size());
                        }
                    }
                } catch (Exception e) {
                    LOG.warn("Errore traduzione prodotto {}: {}", prodottoId, e.getMessage());
                    // Prosegue con il prossimo — un errore non blocca tutto
                }
            }

            LOG.info("PASSO 2 completato: {}/{} prodotti tradotti per menu {}", tradotti, prodottiDaTradurre.size(), menuId);
        } else if (!traduzioneDeepLService.isAttivo()) {
            LOG.info("DeepL non attivo — traduzioni saltate per {} prodotti", prodottiDaTradurre.size());
        }

        // Invalida cache finale
        evictMenuCaches(menuId);

        return new PdfImportResultDTO(parsed.getPortate(), inseriti, avvisi);
    }

    // ── Helpers di parsing ────────────────────────────────────────────────────

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
        LOG.debug("Cache invalidate per menu {}", menuId);
    }
}
