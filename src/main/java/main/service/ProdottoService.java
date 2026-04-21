package main.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.domain.Prodotto;
import main.repository.ProdottoRepository;
import main.security.SecurityUtils;
import main.service.dto.ProdottoDTO;
import main.service.mapper.ProdottoMapper;
import main.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service per {@link main.domain.Prodotto}.
 *
 * Le traduzioni vengono generate in BACKGROUND (async) tramite TraduzioneAsyncService,
 * così il save risponde in 50-100ms invece di 1,5-2 secondi.
 */
@Service
@Transactional
public class ProdottoService {

    private static final Logger LOG = LoggerFactory.getLogger(ProdottoService.class);

    private final ProdottoRepository prodottoRepository;
    private final ProdottoMapper prodottoMapper;
    private final TraduzioneAsyncService traduzioneAsyncService;
    private final CacheManager cacheManager;

    public ProdottoService(
        ProdottoRepository prodottoRepository,
        ProdottoMapper prodottoMapper,
        @Lazy TraduzioneAsyncService traduzioneAsyncService,
        CacheManager cacheManager
    ) {
        this.prodottoRepository = prodottoRepository;
        this.prodottoMapper = prodottoMapper;
        this.traduzioneAsyncService = traduzioneAsyncService;
        this.cacheManager = cacheManager;
    }

    public ProdottoDTO save(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to save Prodotto : {}", prodottoDTO);
        return persistProdotto(prodottoDTO, true);
    }

    public ProdottoDTO saveSenzaTraduzioni(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to save Prodotto WITHOUT translations (PDF import): {}", prodottoDTO);
        Prodotto prodotto = prodottoMapper.toEntity(prodottoDTO);
        Prodotto saved = prodottoRepository.save(prodotto);
        return prodottoMapper.toDto(saved);
    }

    /**
     * Variante usata dall'import PDF: salva senza scatenare UNA traduzione per prodotto
     * (sarebbe un thread per prodotto = esplosione). L'import dopo chiamerà
     * traduzioneAsyncService.traduciMenuCompletoAsync(menuId) UNA volta sola per tutto il batch.
     */
    public ProdottoDTO saveSenzaTraduzioneAsync(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to save Prodotto (no async translate) : {}", prodottoDTO);
        return persistProdotto(prodottoDTO, false);
    }

    public ProdottoDTO update(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to update Prodotto : {}", prodottoDTO);
        checkProdottoOwnership(prodottoDTO.getId());
        return persistProdotto(prodottoDTO, true);
    }

    /**
     * Persiste il prodotto SUBITO (senza aspettare DeepL) e scatena la traduzione
     * in background se: nuovo prodotto, oppure nome/descrizione cambiati.
     */
    private ProdottoDTO persistProdotto(ProdottoDTO dto, boolean scatenaTraduzioneAsync) {
        // Controlla se nome/descrizione sono cambiati PRIMA del save
        boolean richiedeNuovaTraduzione = decidiSeRichiedeTraduzione(dto);

        Prodotto prodotto = prodottoMapper.toEntity(dto);

        // Se non richiede nuova traduzione, copia le traduzioni esistenti per non perderle
        if (!richiedeNuovaTraduzione && dto.getId() != null) {
            Optional<Prodotto> esistente = prodottoRepository.findById(dto.getId());
            esistente.ifPresent(old -> prodotto.setTraduzioni(old.getTraduzioni()));
        }

        Prodotto saved = prodottoRepository.save(prodotto);
        invalidaCacheMenu(saved);

        // Scatena traduzione in background — NON blocca la risposta al client
        if (scatenaTraduzioneAsync && richiedeNuovaTraduzione) {
            UUID menuId = prodottoRepository.findMenuIdByProdottoId(saved.getId()).orElse(null);
            traduzioneAsyncService.traduciProdottoAsync(saved.getId(), menuId);
        }

        return prodottoMapper.toDto(saved);
    }

    private boolean decidiSeRichiedeTraduzione(ProdottoDTO dto) {
        // Prodotto nuovo: richiede traduzione se ha nome o descrizione
        if (dto.getId() == null) {
            return (dto.getNome() != null && !dto.getNome().isBlank()) || (dto.getDescrizione() != null && !dto.getDescrizione().isBlank());
        }
        // Prodotto esistente: richiede traduzione solo se nome o descrizione sono cambiati
        Optional<Prodotto> esistente = prodottoRepository.findById(dto.getId());
        if (esistente.isEmpty()) return true;
        Prodotto old = esistente.get();
        boolean nomeCambiato = !equalsSafe(old.getNome(), dto.getNome());
        boolean descCambiata = !equalsSafe(old.getDescrizione(), dto.getDescrizione());
        // Se è cambiato qualcosa OPPURE non ha ancora traduzioni, rigenera
        if (nomeCambiato || descCambiata) return true;
        return old.getTraduzioni() == null || old.getTraduzioni().isBlank();
    }

    private boolean equalsSafe(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }

    private void invalidaCacheMenu(Prodotto prodotto) {
        try {
            if (prodotto.getPortata() == null) return;
            UUID menuId = prodottoRepository.findMenuIdByProdottoId(prodotto.getId()).orElse(null);
            if (menuId != null) {
                if (cacheManager.getCache("menuCompleto") != null) {
                    cacheManager.getCache("menuCompleto").evict(menuId);
                }
                if (cacheManager.getCache("piattiGiorno") != null) {
                    cacheManager.getCache("piattiGiorno").evict(menuId);
                }
            }
        } catch (Exception e) {
            LOG.warn("Errore invalidazione cache menuCompleto: {}", e.getMessage());
        }
    }

    public Optional<ProdottoDTO> partialUpdate(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to partially update Prodotto : {}", prodottoDTO);
        return prodottoRepository
            .findById(prodottoDTO.getId())
            .map(existingProdotto -> {
                prodottoMapper.partialUpdate(existingProdotto, prodottoDTO);
                return existingProdotto;
            })
            .map(prodottoRepository::save)
            .map(saved -> {
                invalidaCacheMenu(saved);
                // Rigenera traduzioni in background se nome/descrizione sono stati toccati
                if (prodottoDTO.getNome() != null || prodottoDTO.getDescrizione() != null) {
                    UUID menuId = prodottoRepository.findMenuIdByProdottoId(saved.getId()).orElse(null);
                    traduzioneAsyncService.traduciProdottoAsync(saved.getId(), menuId);
                }
                return saved;
            })
            .map(prodottoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<ProdottoDTO> findAll() {
        LOG.debug("Request to get all Prodottos");
        return prodottoRepository.findAll().stream().map(prodottoMapper::toDto).toList();
    }

    public Page<ProdottoDTO> findAllWithEagerRelationships(Pageable pageable) {
        return prodottoRepository.findAllWithEagerRelationships(pageable).map(prodottoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Optional<ProdottoDTO> findOne(UUID id) {
        LOG.debug("Request to get Prodotto : {}", id);
        return prodottoRepository.findOneWithEagerRelationships(id).map(prodottoMapper::toDto);
    }

    public void delete(UUID id) {
        LOG.debug("Request to delete Prodotto : {}", id);
        checkProdottoOwnership(id);
        UUID menuId = prodottoRepository.findMenuIdByProdottoId(id).orElse(null);
        prodottoRepository.deleteById(id);
        if (menuId != null && cacheManager.getCache("menuCompleto") != null) {
            cacheManager.getCache("menuCompleto").evict(menuId);
        }
    }

    private void checkProdottoOwnership(UUID prodottoId) {
        String currentLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new BadRequestAlertException("Utente non autenticato", "prodotto", "unauthenticated"));
        String ownerLogin = prodottoRepository
            .findRistoratoreLoginByProdottoId(prodottoId)
            .orElseThrow(() -> new BadRequestAlertException("Prodotto non trovato", "prodotto", "idnotfound"));
        if (!ownerLogin.equals(currentLogin)) {
            throw new BadRequestAlertException("Accesso negato", "prodotto", "forbidden");
        }
    }

    public List<ProdottoDTO> findByPortataId(UUID portataId) {
        return prodottoRepository.findByPortataId(portataId).stream().map(prodottoMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ProdottoDTO> findProdottiCompletiByMenuId(UUID menuId) {
        LOG.debug("Request to get all Prodotti with allergeni for Menu : {}", menuId);
        return prodottoRepository.findByPortataMenuIdWithAllergeni(menuId).stream().map(prodottoMapper::toDto).toList();
    }
}
