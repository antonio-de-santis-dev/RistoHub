package main.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.domain.PiattoDelGiorno;
import main.repository.PiattoDelGiornoRepository;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.mapper.PiattoDelGiornoMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link main.domain.PiattoDelGiorno}.
 *
 * Per i piatti personalizzati (senza prodotto collegato) genera automaticamente
 * le traduzioni di nome/descrizione via DeepL. Per i piatti con prodotto, le
 * traduzioni vengono lette da Prodotto.traduzioni direttamente dal frontend.
 */
@Service
@Transactional
public class PiattoDelGiornoService {

    private static final Logger LOG = LoggerFactory.getLogger(PiattoDelGiornoService.class);

    private final PiattoDelGiornoRepository piattoDelGiornoRepository;
    private final PiattoDelGiornoMapper piattoDelGiornoMapper;
    private final TraduzioneDeepLService traduzioneDeepLService;
    private final CacheManager cacheManager;

    public PiattoDelGiornoService(
        PiattoDelGiornoRepository piattoDelGiornoRepository,
        PiattoDelGiornoMapper piattoDelGiornoMapper,
        TraduzioneDeepLService traduzioneDeepLService,
        CacheManager cacheManager
    ) {
        this.piattoDelGiornoRepository = piattoDelGiornoRepository;
        this.piattoDelGiornoMapper = piattoDelGiornoMapper;
        this.traduzioneDeepLService = traduzioneDeepLService;
        this.cacheManager = cacheManager;
    }

    public PiattoDelGiornoDTO save(PiattoDelGiornoDTO piattoDelGiornoDTO) {
        LOG.debug("Request to save PiattoDelGiorno : {}", piattoDelGiornoDTO);
        if (piattoDelGiornoDTO.getData() == null) {
            piattoDelGiornoDTO.setData(LocalDate.now());
        }
        return persistPiatto(piattoDelGiornoDTO);
    }

    public PiattoDelGiornoDTO update(PiattoDelGiornoDTO piattoDelGiornoDTO) {
        LOG.debug("Request to update PiattoDelGiorno : {}", piattoDelGiornoDTO);
        return persistPiatto(piattoDelGiornoDTO);
    }

    private PiattoDelGiornoDTO persistPiatto(PiattoDelGiornoDTO dto) {
        PiattoDelGiorno piatto = piattoDelGiornoMapper.toEntity(dto);

        // Genera traduzioni solo per piatti personalizzati (senza prodotto collegato)
        String traduzioniJson = generaTraduzioniSeNecessario(dto);
        if (traduzioniJson != null) {
            piatto.setTraduzioni(traduzioniJson);
        }

        PiattoDelGiorno saved = piattoDelGiornoRepository.save(piatto);
        invalidaCacheMenu(saved);
        return piattoDelGiornoMapper.toDto(saved);
    }

    private String generaTraduzioniSeNecessario(PiattoDelGiornoDTO dto) {
        // Se c'è un prodotto collegato, la traduzione è già sul Prodotto — non la ripetiamo qui
        if (dto.getProdotto() != null && dto.getProdotto().getId() != null) {
            return null;
        }
        // Se nome e descrizione sono entrambi vuoti, non abbiamo nulla da tradurre
        if ((dto.getNome() == null || dto.getNome().isBlank()) && (dto.getDescrizione() == null || dto.getDescrizione().isBlank())) {
            return null;
        }

        if (dto.getId() != null) {
            Optional<PiattoDelGiorno> esistente = piattoDelGiornoRepository.findById(dto.getId());
            if (esistente.isPresent()) {
                PiattoDelGiorno old = esistente.get();
                boolean nomeCambiato = !equalsSafe(old.getNome(), dto.getNome());
                boolean descCambiata = !equalsSafe(old.getDescrizione(), dto.getDescrizione());
                if (!nomeCambiato && !descCambiata && old.getTraduzioni() != null) {
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

    private void invalidaCacheMenu(PiattoDelGiorno piatto) {
        try {
            if (piatto.getMenu() == null || piatto.getMenu().getId() == null) return;
            UUID menuId = piatto.getMenu().getId();
            if (cacheManager.getCache("menuCompleto") != null) {
                cacheManager.getCache("menuCompleto").evict(menuId);
            }
            if (cacheManager.getCache("piattiGiorno") != null) {
                cacheManager.getCache("piattiGiorno").evict(menuId);
            }
        } catch (Exception e) {
            LOG.warn("Errore invalidazione cache menuCompleto: {}", e.getMessage());
        }
    }

    public Optional<PiattoDelGiornoDTO> partialUpdate(PiattoDelGiornoDTO piattoDelGiornoDTO) {
        LOG.debug("Request to partially update PiattoDelGiorno : {}", piattoDelGiornoDTO);
        return piattoDelGiornoRepository
            .findById(piattoDelGiornoDTO.getId())
            .map(existingPiattoDelGiorno -> {
                piattoDelGiornoMapper.partialUpdate(existingPiattoDelGiorno, piattoDelGiornoDTO);

                // Rigenera traduzioni se piatto personalizzato e nome/descrizione presenti
                if (
                    existingPiattoDelGiorno.getProdotto() == null &&
                    ((existingPiattoDelGiorno.getNome() != null && !existingPiattoDelGiorno.getNome().isBlank()) ||
                        (existingPiattoDelGiorno.getDescrizione() != null && !existingPiattoDelGiorno.getDescrizione().isBlank()))
                ) {
                    String json = traduzioneDeepLService.buildTraduzioniJson(
                        existingPiattoDelGiorno.getNome(),
                        existingPiattoDelGiorno.getDescrizione()
                    );
                    if (json != null) existingPiattoDelGiorno.setTraduzioni(json);
                }
                return existingPiattoDelGiorno;
            })
            .map(piattoDelGiornoRepository::save)
            .map(saved -> {
                invalidaCacheMenu(saved);
                return saved;
            })
            .map(piattoDelGiornoMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<PiattoDelGiornoDTO> findAll() {
        LOG.debug("Request to get all PiattoDelGiornos with full allergenis");
        List<PiattoDelGiorno> baseList = piattoDelGiornoRepository.findAllConProdotto();
        piattoDelGiornoRepository.findAllConAllergeniProdotto();
        piattoDelGiornoRepository.findAllConAllergeniDiretti();
        return baseList.stream().map(piattoDelGiornoMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<PiattoDelGiornoDTO> findAllByCurrentUser() {
        LOG.debug("Request to get all PiattoDelGiornos for current user");
        return piattoDelGiornoRepository
            .findByMenuRistoratoreLogin(main.security.SecurityUtils.getCurrentUserLogin().orElseThrow())
            .stream()
            .map(piattoDelGiornoMapper::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public Optional<PiattoDelGiornoDTO> findOne(UUID id) {
        LOG.debug("Request to get PiattoDelGiorno : {}", id);
        return piattoDelGiornoRepository.findById(id).map(piattoDelGiornoMapper::toDto);
    }

    public void delete(UUID id) {
        LOG.debug("Request to delete PiattoDelGiorno : {}", id);
        UUID menuId = piattoDelGiornoRepository.findById(id).map(p -> p.getMenu() != null ? p.getMenu().getId() : null).orElse(null);
        piattoDelGiornoRepository.deleteById(id);
        if (menuId != null && cacheManager.getCache("menuCompleto") != null) {
            cacheManager.getCache("menuCompleto").evict(menuId);
        }
        if (menuId != null && cacheManager.getCache("piattiGiorno") != null) {
            cacheManager.getCache("piattiGiorno").evict(menuId);
        }
    }
}
