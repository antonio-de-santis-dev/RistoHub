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
 * Libreria: Apache PDFBox 3.x
 *   Dipendenza da aggiungere al pom.xml:
 *   <dependency>
 *     <groupId>org.apache.pdfbox</groupId>
 *     <artifactId>pdfbox</artifactId>
 *     <version>3.0.3</version>
 *   </dependency>
 */
@Service
@Transactional
public class PdfImportService {

    private static final Logger LOG = LoggerFactory.getLogger(PdfImportService.class);

    private final PortataRepository portataRepository;
    private final ProdottoService prodottoService;
    private final MenuService menuService;

    public PdfImportService(PortataRepository portataRepository, ProdottoService prodottoService, MenuService menuService) {
        this.portataRepository = portataRepository;
        this.prodottoService = prodottoService;
        this.menuService = menuService;
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
     * @param file   file PDF caricato
     * @param menuId UUID del menu in cui inserire i prodotti
     * @return struttura con prodotti inseriti e avvisi
     */
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
                    dto.setNome(pi.getNome().trim());
                    dto.setDescrizione(pi.getDescrizione() != null && !pi.getDescrizione().isBlank() ? pi.getDescrizione().trim() : null);
                    dto.setPrezzo(parsePrezzo(pi.getPrezzo()));

                    PortataDTO portataRef = new PortataDTO();
                    portataRef.setId(portataId);
                    dto.setPortata(portataRef);

                    prodottoService.save(dto);
                    inseriti++;
                } catch (Exception e) {
                    LOG.warn("Errore durante il salvataggio del prodotto '{}': {}", pi.getNome(), e.getMessage());
                    avvisi.add("Prodotto ignorato per errore: \"" + pi.getNome() + "\" — " + e.getMessage());
                }
            }
        }

        return new PdfImportResultDTO(parsed.getPortate(), inseriti, avvisi);
    }

    // ── Helpers di parsing ────────────────────────────────────────────────────

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
                portataCorrente = rigaTrim.substring("PORTATA:".length()).trim();
                prodottiCorrenti = new ArrayList<>();
                continue;
            }

            // Riga prodotto: inizia con "- "
            if (portataCorrente != null && rigaTrim.startsWith("- ")) {
                String contenuto = rigaTrim.substring(2).trim();
                String[] parti = contenuto.split("\\|", -1);
                if (parti.length >= 1) {
                    String nome = parti[0].trim();
                    String descrizione = parti.length >= 2 ? parti[1].trim() : "";
                    String prezzo = parti.length >= 3 ? parti[2].trim() : "0";
                    if (!nome.isBlank()) {
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
}
