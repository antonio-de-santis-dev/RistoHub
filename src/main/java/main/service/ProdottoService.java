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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link main.domain.Prodotto}.
 *
 * Su save/update genera automaticamente le traduzioni tramite TraduzioneDeepLService
 * e le salva nel campo {@code traduzioni} dell'entità.
 * Invalida anche la cache "menuCompleto" per rendere subito visibili le nuove traduzioni
 * sul menu pubblico.
 */
@Service
@Transactional
public class ProdottoService {

    private static final Logger LOG = LoggerFactory.getLogger(ProdottoService.class);

    private final ProdottoRepository prodottoRepository;
    private final ProdottoMapper prodottoMapper;
    private final TraduzioneDeepLService traduzioneDeepLService;
    private final CacheManager cacheManager;

    public ProdottoService(
        ProdottoRepository prodottoRepository,
        ProdottoMapper prodottoMapper,
        TraduzioneDeepLService traduzioneDeepLService,
        CacheManager cacheManager
    ) {
        this.prodottoRepository = prodottoRepository;
        this.prodottoMapper = prodottoMapper;
        this.traduzioneDeepLService = traduzioneDeepLService;
        this.cacheManager = cacheManager;
    }

    public ProdottoDTO save(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to save Prodotto : {}", prodottoDTO);
        return persistProdotto(prodottoDTO);
    }

    /**
     * Salva un prodotto SENZA generare le traduzioni DeepL.
     *
     * Usato dall'import PDF per evitare che ogni singolo prodotto scateni
     * 4 chiamate sincrone a DeepL (~2 secondi ciascuna). Dopo aver salvato
     * tutti i prodotti velocemente in italiano, il PdfImportService chiama
     * UNA volta TraduzioneAsyncService.traduciMenuCompletoAsync(menuId)
     * che traduce tutto in background.
     *
     * Vantaggio: un PDF con 30 prodotti si importa in 2-3 secondi
     * invece di 60+ secondi (con timeout).
     */
    public ProdottoDTO saveSenzaTraduzioni(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to save Prodotto WITHOUT translations (PDF import): {}", prodottoDTO);
        Prodotto prodotto = prodottoMapper.toEntity(prodottoDTO);
        Prodotto saved = prodottoRepository.save(prodotto);
        return prodottoMapper.toDto(saved);
    }

    public ProdottoDTO update(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to update Prodotto : {}", prodottoDTO);
        checkProdottoOwnership(prodottoDTO.getId());
        return persistProdotto(prodottoDTO);
    }

    /**
     * Persiste il prodotto e, dopo il save, genera le traduzioni via DeepL.
     * La generazione avviene DOPO il save iniziale in modo che anche un errore
     * DeepL non blocchi il salvataggio del prodotto (graceful degradation).
     */
    private ProdottoDTO persistProdotto(ProdottoDTO dto) {
        Prodotto prodotto = prodottoMapper.toEntity(dto);

        // Rigenera traduzioni se nome o descrizione sono cambiati rispetto all'esistente
        // (su nuovo insert la entity non ha ancora id, quindi rigenera sempre).
        String traduzioniJson = generaTraduzioniSeNecessario(dto);
        if (traduzioniJson != null) {
            prodotto.setTraduzioni(traduzioniJson);
        }

        Prodotto saved = prodottoRepository.save(prodotto);

        // Invalida la cache del menu completo per il menu di questo prodotto
        invalidaCacheMenu(saved);

        return prodottoMapper.toDto(saved);
    }

    /**
     * Genera le traduzioni SOLO se: è un nuovo prodotto (id null),
     * oppure nome/descrizione sono cambiati rispetto al DB.
     * Evita di spendere quota DeepL su update che modificano solo prezzo/allergeni.
     */
    private String generaTraduzioniSeNecessario(ProdottoDTO dto) {
        if (dto.getId() != null) {
            Optional<Prodotto> esistente = prodottoRepository.findById(dto.getId());
            if (esistente.isPresent()) {
                Prodotto old = esistente.get();
                boolean nomeCambiato = !equalsSafe(old.getNome(), dto.getNome());
                boolean descCambiata = !equalsSafe(old.getDescrizione(), dto.getDescrizione());
                if (!nomeCambiato && !descCambiata && old.getTraduzioni() != null) {
                    // Nulla è cambiato e abbiamo già traduzioni: le riutilizziamo
                    return old.getTraduzioni();
                }
            }
        }
        return traduzioneDeepLService.buildTraduzioniJson(dto.getNome(), dto.getDescrizione());
    }

    private boolean equalsSafe(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }

    /**
     * Invalida la cache "menuCompleto" per il menu a cui appartiene il prodotto.
     * Necessaria affinché il frontend veda subito le nuove traduzioni senza aspettare
     * la scadenza della cache EhCache.
     */
    private void invalidaCacheMenu(Prodotto prodotto) {
        try {
            if (prodotto.getPortata() == null) return;
            UUID portataId = prodotto.getPortata().getId();
            if (portataId == null) return;
            // Risaliamo al menu via la portata appena persistita
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
                // Rigenera traduzioni se il partialUpdate ha toccato nome o descrizione
                if (prodottoDTO.getNome() != null || prodottoDTO.getDescrizione() != null) {
                    String json = traduzioneDeepLService.buildTraduzioniJson(existingProdotto.getNome(), existingProdotto.getDescrizione());
                    if (json != null) existingProdotto.setTraduzioni(json);
                }
                return existingProdotto;
            })
            .map(prodottoRepository::save)
            .map(saved -> {
                invalidaCacheMenu(saved);
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
        // Invalida cache PRIMA del delete, così findMenuIdByProdottoId trova ancora il prodotto
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
