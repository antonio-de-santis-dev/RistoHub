package main.web.rest;

import java.io.IOException;
import java.util.UUID;
import main.security.AuthoritiesConstants;
import main.service.PdfImportService;
import main.service.dto.PdfImportResultDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller per l'importazione bulk di prodotti tramite PDF.
 *
 * Endpoint esposti:
 *
 *   POST /api/menus/{menuId}/import-pdf/preview
 *     — Analizza il PDF e restituisce la struttura estratta (anteprima)
 *       senza salvare nulla su DB.
 *
 *   POST /api/menus/{menuId}/import-pdf/confirm
 *     — Analizza il PDF e salva i prodotti nelle portate corrispondenti.
 *
 * Sicurezza: ROLE_USER (solo l'owner del menu può importare).
 * La verifica ownership è delegata a PdfImportService.importaPdf().
 */
@RestController
@RequestMapping("/api/menus/{menuId}/import-pdf")
public class PdfImportResource {

    private static final Logger LOG = LoggerFactory.getLogger(PdfImportResource.class);

    private final PdfImportService pdfImportService;

    public PdfImportResource(PdfImportService pdfImportService) {
        this.pdfImportService = pdfImportService;
    }

    /**
     * POST /api/menus/{menuId}/import-pdf/preview
     * Analizza il PDF senza scrivere su DB — restituisce la struttura estratta
     * per la visualizzazione dell'anteprima nel frontend.
     */
    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Secured(AuthoritiesConstants.USER)
    public ResponseEntity<PdfImportResultDTO> preview(@PathVariable UUID menuId, @RequestParam("file") MultipartFile file) {
        LOG.debug("REST request per preview importazione PDF, menu: {}", menuId);
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            PdfImportResultDTO result = pdfImportService.analizzaPdf(file);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            LOG.error("Errore lettura PDF durante preview: {}", e.getMessage());
            return ResponseEntity.unprocessableEntity().build();
        }
    }

    /**
     * POST /api/menus/{menuId}/import-pdf/confirm
     * Importa effettivamente i prodotti nel menu dopo la conferma dell'utente.
     */
    @PostMapping(value = "/confirm", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Secured(AuthoritiesConstants.USER)
    public ResponseEntity<PdfImportResultDTO> confirm(@PathVariable UUID menuId, @RequestParam("file") MultipartFile file) {
        LOG.debug("REST request per conferma importazione PDF, menu: {}", menuId);
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            PdfImportResultDTO result = pdfImportService.importaPdf(file, menuId);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            LOG.error("Errore lettura PDF durante import: {}", e.getMessage());
            return ResponseEntity.unprocessableEntity().build();
        }
    }
}
