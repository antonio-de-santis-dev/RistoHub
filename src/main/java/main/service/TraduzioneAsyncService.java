package main.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import main.domain.PiattoDelGiorno;
import main.domain.Portata;
import main.domain.Prodotto;
import main.repository.PiattoDelGiornoRepository;
import main.repository.PortataRepository;
import main.repository.ProdottoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Traduce entità in BACKGROUND (thread separato) dopo un import bulk.
 *
 * Uso principale: import PDF. Il controller salva i prodotti senza traduzioni e
 * risponde subito al client. Questo service, scatenato in parallelo, traduce
 * tutti i record del menu con traduzioni mancanti. Le traduzioni compariranno
 * nel menu quando l'utente ricarica la pagina (15-60 secondi dopo l'import,
 * a seconda della dimensione del PDF).
 *
 * @Async("taskExecutor") usa il pool configurato in AsyncConfiguration.
 */
@Service
public class TraduzioneAsyncService {

    private static final Logger LOG = LoggerFactory.getLogger(TraduzioneAsyncService.class);

    private final TraduzioneDeepLService traduzioneDeepLService;
    private final ProdottoRepository prodottoRepository;
    private final PortataRepository portataRepository;
    private final PiattoDelGiornoRepository piattoDelGiornoRepository;
    private final CacheManager cacheManager;

    public TraduzioneAsyncService(
        TraduzioneDeepLService traduzioneDeepLService,
        ProdottoRepository prodottoRepository,
        PortataRepository portataRepository,
        PiattoDelGiornoRepository piattoDelGiornoRepository,
        CacheManager cacheManager
    ) {
        this.traduzioneDeepLService = traduzioneDeepLService;
        this.prodottoRepository = prodottoRepository;
        this.portataRepository = portataRepository;
        this.piattoDelGiornoRepository = piattoDelGiornoRepository;
        this.cacheManager = cacheManager;
    }

    /**
     * Traduce in BATCH tutte le entità di un menu che non hanno ancora traduzioni.
     *
     * Scatenato dopo l'import PDF e dall'endpoint di fallback translate-missing.
     * Gira in un thread separato: il chiamante riceve il ritorno immediatamente.
     *
     * Strategia anti-timeout: invalida la cache del menuCompleto ogni 5 prodotti
     * tradotti, così l'utente che ricarica la pagina durante il processo vede
     * progressivamente le traduzioni comparire (invece di tutte alla fine).
     */
    @Async("taskExecutor")
    @Transactional
    public void traduciMenuCompletoAsync(UUID menuId) {
        if (!traduzioneDeepLService.isAttivo()) {
            LOG.info("DeepL non attivo — traduzione async saltata per menu {}", menuId);
            return;
        }

        LOG.info("✨ Avvio traduzione batch async per menu {}", menuId);
        long inizio = System.currentTimeMillis();
        int tradotti = 0;

        try {
            // ── 1. Prodotti senza traduzioni ────────────────────────────────
            List<Prodotto> prodotti = prodottoRepository.findProdottiSenzaTraduzioniByMenuId(menuId);
            LOG.info("  → {} prodotti da tradurre", prodotti.size());

            for (Prodotto p : prodotti) {
                try {
                    String json = traduzioneDeepLService.buildTraduzioniJson(p.getNome(), p.getDescrizione());
                    if (json != null) {
                        p.setTraduzioni(json);
                        prodottoRepository.save(p);
                        tradotti++;
                        // Invalida cache ogni 5 prodotti → l'utente vede risultati incrementali
                        if (tradotti % 5 == 0) invalidaCache(menuId);
                    }
                } catch (Exception e) {
                    LOG.warn("Errore traduzione prodotto {} in batch: {}", p.getId(), e.getMessage());
                    // Prosegue con il prossimo prodotto — un errore non blocca l'intero batch
                }
            }

            // ── 2. Portate PERSONALIZZATA senza traduzioni ─────────────────
            List<Portata> portate = portataRepository.findByMenuIdOrdered(menuId);
            for (Portata p : portate) {
                if (p.getTipo() == null || !"PERSONALIZZATA".equals(p.getTipo().name())) continue;
                if (p.getNomePersonalizzato() == null || p.getNomePersonalizzato().isBlank()) continue;
                if (p.getTraduzioni() != null && !p.getTraduzioni().isBlank()) continue;
                try {
                    Map<String, String> campi = new LinkedHashMap<>();
                    campi.put("nomePersonalizzato", p.getNomePersonalizzato());
                    String json = traduzioneDeepLService.buildTraduzioniJson(campi);
                    if (json != null) {
                        p.setTraduzioni(json);
                        portataRepository.save(p);
                        tradotti++;
                    }
                } catch (Exception e) {
                    LOG.warn("Errore traduzione portata {} in batch: {}", p.getId(), e.getMessage());
                }
            }

            // ── 3. Piatti del giorno personalizzati senza traduzioni ────────
            List<PiattoDelGiorno> piatti = piattoDelGiornoRepository.findByMenuIdWithNullTraduzioni(menuId);
            for (PiattoDelGiorno p : piatti) {
                if (p.getProdotto() != null) continue; // i piatti con prodotto usano prodotto.traduzioni
                boolean nomeVuoto = p.getNome() == null || p.getNome().isBlank();
                boolean descVuota = p.getDescrizione() == null || p.getDescrizione().isBlank();
                if (nomeVuoto && descVuota) continue;
                try {
                    String json = traduzioneDeepLService.buildTraduzioniJson(p.getNome(), p.getDescrizione());
                    if (json != null) {
                        p.setTraduzioni(json);
                        piattoDelGiornoRepository.save(p);
                        tradotti++;
                    }
                } catch (Exception e) {
                    LOG.warn("Errore traduzione piatto del giorno {} in batch: {}", p.getId(), e.getMessage());
                }
            }

            // Invalidazione finale
            invalidaCache(menuId);
            long durata = (System.currentTimeMillis() - inizio) / 1000;
            LOG.info("✓ Traduzione batch async completata: {} entità tradotte in {}s per menu {}", tradotti, durata, menuId);
        } catch (Exception e) {
            LOG.error("Errore globale nel batch async di traduzione per menu {}: {}", menuId, e.getMessage(), e);
        }
    }

    private void invalidaCache(UUID menuId) {
        if (menuId == null) return;
        try {
            if (cacheManager.getCache("menuCompleto") != null) {
                cacheManager.getCache("menuCompleto").evict(menuId);
            }
            if (cacheManager.getCache("piattiGiorno") != null) {
                cacheManager.getCache("piattiGiorno").evict(menuId);
            }
        } catch (Exception e) {
            LOG.warn("Errore invalidazione cache: {}", e.getMessage());
        }
    }
}
