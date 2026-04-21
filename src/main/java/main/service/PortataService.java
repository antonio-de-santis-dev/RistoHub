package main.service;

import java.util.*;
import main.domain.Portata;
import main.repository.PortataRepository;
import main.security.SecurityUtils;
import main.service.dto.PortataDTO;
import main.service.mapper.PortataMapper;
import main.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service per {@link main.domain.Portata}.
 *
 * Le traduzioni per le portate PERSONALIZZATA vengono generate in BACKGROUND (async).
 */
@Service
@Transactional
public class PortataService {

    private static final Logger LOG = LoggerFactory.getLogger(PortataService.class);

    private final PortataRepository portataRepository;
    private final PortataMapper portataMapper;
    private final TraduzioneAsyncService traduzioneAsyncService;
    private final CacheManager cacheManager;

    public PortataService(
        PortataRepository portataRepository,
        PortataMapper portataMapper,
        @Lazy TraduzioneAsyncService traduzioneAsyncService,
        CacheManager cacheManager
    ) {
        this.portataRepository = portataRepository;
        this.portataMapper = portataMapper;
        this.traduzioneAsyncService = traduzioneAsyncService;
        this.cacheManager = cacheManager;
    }

    public PortataDTO save(PortataDTO portataDTO) {
        LOG.debug("Request to save Portata : {}", portataDTO);
        return persistPortata(portataDTO);
    }

    public PortataDTO update(PortataDTO portataDTO) {
        LOG.debug("Request to update Portata : {}", portataDTO);
        checkPortataOwnership(portataDTO.getId());
        return persistPortata(portataDTO);
    }

    private PortataDTO persistPortata(PortataDTO dto) {
        boolean richiedeTraduzione = decidiSeRichiedeTraduzione(dto);

        Portata portata = portataMapper.toEntity(dto);

        // Preserva le traduzioni esistenti se non è cambiato nulla
        if (!richiedeTraduzione && dto.getId() != null) {
            Optional<Portata> esistente = portataRepository.findById(dto.getId());
            esistente.ifPresent(old -> portata.setTraduzioni(old.getTraduzioni()));
        }

        Portata saved = portataRepository.save(portata);
        invalidaCacheMenu(saved);

        if (richiedeTraduzione) {
            UUID menuId = saved.getMenu() != null ? saved.getMenu().getId() : null;
            traduzioneAsyncService.traduciPortataAsync(saved.getId(), menuId);
        }

        return portataMapper.toDto(saved);
    }

    private boolean decidiSeRichiedeTraduzione(PortataDTO dto) {
        if (dto.getTipo() == null || !"PERSONALIZZATA".equals(dto.getTipo().name())) return false;
        if (dto.getNomePersonalizzato() == null || dto.getNomePersonalizzato().isBlank()) return false;
        if (dto.getId() == null) return true;
        Optional<Portata> esistente = portataRepository.findById(dto.getId());
        if (esistente.isEmpty()) return true;
        Portata old = esistente.get();
        boolean nomeCambiato = old.getNomePersonalizzato() == null || !old.getNomePersonalizzato().equals(dto.getNomePersonalizzato());
        if (nomeCambiato) return true;
        return old.getTraduzioni() == null || old.getTraduzioni().isBlank();
    }

    private void invalidaCacheMenu(Portata portata) {
        try {
            if (portata.getMenu() == null || portata.getMenu().getId() == null) return;
            UUID menuId = portata.getMenu().getId();
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

    public Optional<PortataDTO> partialUpdate(PortataDTO portataDTO) {
        LOG.debug("Request to partially update Portata : {}", portataDTO);
        return portataRepository
            .findById(portataDTO.getId())
            .map(existingPortata -> {
                portataMapper.partialUpdate(existingPortata, portataDTO);
                return existingPortata;
            })
            .map(portataRepository::save)
            .map(saved -> {
                invalidaCacheMenu(saved);
                if (
                    saved.getTipo() != null &&
                    "PERSONALIZZATA".equals(saved.getTipo().name()) &&
                    saved.getNomePersonalizzato() != null &&
                    !saved.getNomePersonalizzato().isBlank()
                ) {
                    UUID menuId = saved.getMenu() != null ? saved.getMenu().getId() : null;
                    traduzioneAsyncService.traduciPortataAsync(saved.getId(), menuId);
                }
                return saved;
            })
            .map(portataMapper::toDto);
    }

    @Transactional(readOnly = true)
    public List<PortataDTO> findAll() {
        LOG.debug("Request to get all Portatas");
        return portataRepository.findAll().stream().map(portataMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public Optional<PortataDTO> findOne(UUID id) {
        LOG.debug("Request to get Portata : {}", id);
        return portataRepository.findById(id).map(portataMapper::toDto);
    }

    public void delete(UUID id) {
        LOG.debug("Request to delete Portata : {}", id);
        checkPortataOwnership(id);
        UUID menuId = portataRepository.findById(id).map(p -> p.getMenu() != null ? p.getMenu().getId() : null).orElse(null);
        portataRepository.deleteById(id);
        if (menuId != null && cacheManager.getCache("menuCompleto") != null) {
            cacheManager.getCache("menuCompleto").evict(menuId);
        }
    }

    private void checkPortataOwnership(UUID portataId) {
        String currentLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new BadRequestAlertException("Utente non autenticato", "portata", "unauthenticated"));
        Portata portata = portataRepository
            .findById(portataId)
            .orElseThrow(() -> new BadRequestAlertException("Portata non trovata", "portata", "idnotfound"));
        if (
            portata.getMenu() == null ||
            portata.getMenu().getRistoratore() == null ||
            !portata.getMenu().getRistoratore().getLogin().equals(currentLogin)
        ) {
            throw new BadRequestAlertException("Accesso negato", "portata", "forbidden");
        }
    }

    public List<PortataDTO> findByMenuId(UUID menuId) {
        return portataRepository.findByMenuIdOrdered(menuId).stream().map(portataMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<Portata> findPortateEntitiesByMenuId(UUID menuId) {
        return portataRepository.findByMenuIdOrdered(menuId);
    }
}
