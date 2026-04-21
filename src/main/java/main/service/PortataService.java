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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link main.domain.Portata}.
 *
 * Su save/update di portate PERSONALIZZATA, genera automaticamente le traduzioni
 * del nomePersonalizzato tramite TraduzioneDeepLService.
 * Le portate DEFAULT non richiedono traduzione automatica (nomi enum già tradotti
 * lato frontend in NOMI_PORTATE).
 */
@Service
@Transactional
public class PortataService {

    private static final Logger LOG = LoggerFactory.getLogger(PortataService.class);

    private final PortataRepository portataRepository;
    private final PortataMapper portataMapper;
    private final TraduzioneDeepLService traduzioneDeepLService;
    private final CacheManager cacheManager;

    public PortataService(
        PortataRepository portataRepository,
        PortataMapper portataMapper,
        TraduzioneDeepLService traduzioneDeepLService,
        CacheManager cacheManager
    ) {
        this.portataRepository = portataRepository;
        this.portataMapper = portataMapper;
        this.traduzioneDeepLService = traduzioneDeepLService;
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
        Portata portata = portataMapper.toEntity(dto);

        // Genera traduzione solo per portate PERSONALIZZATA con nome non vuoto
        String traduzioniJson = generaTraduzioniSeNecessario(dto);
        if (traduzioniJson != null) {
            portata.setTraduzioni(traduzioniJson);
        }

        Portata saved = portataRepository.save(portata);
        invalidaCacheMenu(saved);
        return portataMapper.toDto(saved);
    }

    /**
     * Genera traduzioni solo se:
     * - la portata è PERSONALIZZATA (le DEFAULT sono tradotte lato frontend con NOMI_PORTATE)
     * - c'è un nomePersonalizzato valorizzato
     * - il nome è cambiato rispetto all'entità esistente (oppure è una nuova portata)
     */
    private String generaTraduzioniSeNecessario(PortataDTO dto) {
        if (dto.getTipo() == null || !"PERSONALIZZATA".equals(dto.getTipo().name())) {
            return null;
        }
        if (dto.getNomePersonalizzato() == null || dto.getNomePersonalizzato().isBlank()) {
            return null;
        }

        if (dto.getId() != null) {
            Optional<Portata> esistente = portataRepository.findById(dto.getId());
            if (esistente.isPresent()) {
                Portata old = esistente.get();
                boolean nomeCambiato =
                    old.getNomePersonalizzato() == null || !old.getNomePersonalizzato().equals(dto.getNomePersonalizzato());
                if (!nomeCambiato && old.getTraduzioni() != null) {
                    return old.getTraduzioni();
                }
            }
        }

        Map<String, String> campi = new LinkedHashMap<>();
        campi.put("nomePersonalizzato", dto.getNomePersonalizzato());
        return traduzioneDeepLService.buildTraduzioniJson(campi);
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

                // Rigenera traduzione se necessario
                if (
                    existingPortata.getTipo() != null &&
                    "PERSONALIZZATA".equals(existingPortata.getTipo().name()) &&
                    existingPortata.getNomePersonalizzato() != null &&
                    !existingPortata.getNomePersonalizzato().isBlank()
                ) {
                    Map<String, String> campi = new LinkedHashMap<>();
                    campi.put("nomePersonalizzato", existingPortata.getNomePersonalizzato());
                    String json = traduzioneDeepLService.buildTraduzioniJson(campi);
                    if (json != null) existingPortata.setTraduzioni(json);
                }
                return existingPortata;
            })
            .map(portataRepository::save)
            .map(saved -> {
                invalidaCacheMenu(saved);
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
        // Recupera l'id del menu prima del delete per invalidare la cache
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

    /**
     * Ritorna tutte le portate del menu direttamente come entità (con il campo traduzioni).
     * Usato da MenuCompletoService per includere le traduzioni nel DTO aggregato.
     */
    @Transactional(readOnly = true)
    public List<Portata> findPortateEntitiesByMenuId(UUID menuId) {
        return portataRepository.findByMenuIdOrdered(menuId);
    }
}
