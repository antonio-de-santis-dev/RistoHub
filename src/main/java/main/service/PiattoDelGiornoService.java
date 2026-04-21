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
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service per {@link main.domain.PiattoDelGiorno}.
 *
 * Per i piatti personalizzati le traduzioni vengono generate in BACKGROUND (async).
 */
@Service
@Transactional
public class PiattoDelGiornoService {

    private static final Logger LOG = LoggerFactory.getLogger(PiattoDelGiornoService.class);

    private final PiattoDelGiornoRepository piattoDelGiornoRepository;
    private final PiattoDelGiornoMapper piattoDelGiornoMapper;
    private final TraduzioneAsyncService traduzioneAsyncService;
    private final CacheManager cacheManager;

    public PiattoDelGiornoService(
        PiattoDelGiornoRepository piattoDelGiornoRepository,
        PiattoDelGiornoMapper piattoDelGiornoMapper,
        @Lazy TraduzioneAsyncService traduzioneAsyncService,
        CacheManager cacheManager
    ) {
        this.piattoDelGiornoRepository = piattoDelGiornoRepository;
        this.piattoDelGiornoMapper = piattoDelGiornoMapper;
        this.traduzioneAsyncService = traduzioneAsyncService;
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
        boolean richiedeTraduzione = decidiSeRichiedeTraduzione(dto);

        PiattoDelGiorno piatto = piattoDelGiornoMapper.toEntity(dto);

        // Preserva traduzioni esistenti se non è cambiato nulla
        if (!richiedeTraduzione && dto.getId() != null) {
            Optional<PiattoDelGiorno> esistente = piattoDelGiornoRepository.findById(dto.getId());
            esistente.ifPresent(old -> piatto.setTraduzioni(old.getTraduzioni()));
        }

        PiattoDelGiorno saved = piattoDelGiornoRepository.save(piatto);
        invalidaCacheMenu(saved);

        if (richiedeTraduzione) {
            UUID menuId = saved.getMenu() != null ? saved.getMenu().getId() : null;
            traduzioneAsyncService.traduciPiattoGiornoAsync(saved.getId(), menuId);
        }

        return piattoDelGiornoMapper.toDto(saved);
    }

    private boolean decidiSeRichiedeTraduzione(PiattoDelGiornoDTO dto) {
        // Se ha prodotto collegato, le traduzioni sono sul prodotto
        if (dto.getProdotto() != null && dto.getProdotto().getId() != null) return false;
        if (
            (dto.getNome() == null || dto.getNome().isBlank()) && (dto.getDescrizione() == null || dto.getDescrizione().isBlank())
        ) return false;
        if (dto.getId() == null) return true;
        Optional<PiattoDelGiorno> esistente = piattoDelGiornoRepository.findById(dto.getId());
        if (esistente.isEmpty()) return true;
        PiattoDelGiorno old = esistente.get();
        boolean nomeCambiato = !equalsSafe(old.getNome(), dto.getNome());
        boolean descCambiata = !equalsSafe(old.getDescrizione(), dto.getDescrizione());
        if (nomeCambiato || descCambiata) return true;
        return old.getTraduzioni() == null || old.getTraduzioni().isBlank();
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
                return existingPiattoDelGiorno;
            })
            .map(piattoDelGiornoRepository::save)
            .map(saved -> {
                invalidaCacheMenu(saved);
                if (
                    saved.getProdotto() == null &&
                    ((saved.getNome() != null && !saved.getNome().isBlank()) ||
                        (saved.getDescrizione() != null && !saved.getDescrizione().isBlank()))
                ) {
                    UUID menuId = saved.getMenu() != null ? saved.getMenu().getId() : null;
                    traduzioneAsyncService.traduciPiattoGiornoAsync(saved.getId(), menuId);
                }
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
