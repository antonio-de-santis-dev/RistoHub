package main.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.domain.Allergene;
import main.repository.AllergeneRepository;
import main.service.dto.AllergeneDTO;
import main.service.mapper.AllergeneMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link main.domain.Allergene}.
 */
@Service
@Transactional
public class AllergeneService {

    private static final Logger LOG = LoggerFactory.getLogger(AllergeneService.class);

    private final AllergeneRepository allergeneRepository;

    private final AllergeneMapper allergeneMapper;

    public AllergeneService(AllergeneRepository allergeneRepository, AllergeneMapper allergeneMapper) {
        this.allergeneRepository = allergeneRepository;
        this.allergeneMapper = allergeneMapper;
    }

    /**
     * Save a allergene.
     *
     * @param allergeneDTO the entity to save.
     * @return the persisted entity.
     */

    /**
     * Update a allergene.
     *
     * @param allergeneDTO the entity to save.
     * @return the persisted entity.
     */
    @CacheEvict(cacheNames = "main.domain.Allergene", allEntries = true)
    public AllergeneDTO save(AllergeneDTO allergeneDTO) {
        LOG.debug("Request to save Allergene : {}", allergeneDTO);
        return persistAllergene(allergeneDTO);
    }

    @CacheEvict(cacheNames = "main.domain.Allergene", allEntries = true)
    public AllergeneDTO update(AllergeneDTO allergeneDTO) {
        LOG.debug("Request to update Allergene : {}", allergeneDTO);
        return persistAllergene(allergeneDTO);
    }

    // OPT-10: metodo privato condiviso — evita duplicazione tra save() e update()
    private AllergeneDTO persistAllergene(AllergeneDTO dto) {
        Allergene allergene = allergeneMapper.toEntity(dto);
        return allergeneMapper.toDto(allergeneRepository.save(allergene));
    }

    /**
     * Partially update a allergene.
     *
     * @param allergeneDTO the entity to update partially.
     * @return the persisted entity.
     */
    @CacheEvict(cacheNames = "main.domain.Allergene", allEntries = true)
    public Optional<AllergeneDTO> partialUpdate(AllergeneDTO allergeneDTO) {
        LOG.debug("Request to partially update Allergene : {}", allergeneDTO);

        return allergeneRepository
            .findById(allergeneDTO.getId())
            .map(existingAllergene -> {
                allergeneMapper.partialUpdate(existingAllergene, allergeneDTO);

                return existingAllergene;
            })
            .map(allergeneRepository::save)
            .map(allergeneMapper::toDto);
    }

    /**
     * Get all the allergenes.
     *
     * <p>TTL 24 ore (coldCacheConfiguration): gli allergeni sono dati quasi-immutabili
     * — cambiano solo con intervento manuale dell'admin. Tenerli in cache per un'intera
     * giornata evita query ripetute al DB su ogni chiamata pubblica /api/public/menus/{id}/full.
     * Il @CacheEvict su save/update/delete/partialUpdate garantisce coerenza immediata
     * in caso di modifica.</p>
     *
     * @return the list of entities.
     */
    @Cacheable(cacheNames = "main.domain.Allergene")
    @Transactional(readOnly = true)
    public List<AllergeneDTO> findAll() {
        LOG.debug("Request to get all Allergenes");
        return allergeneRepository.findAll().stream().map(allergeneMapper::toDto).toList();
    }

    /**
     * Get one allergene by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<AllergeneDTO> findOne(UUID id) {
        LOG.debug("Request to get Allergene : {}", id);
        return allergeneRepository.findById(id).map(allergeneMapper::toDto);
    }

    /**
     * Delete the allergene by id.
     *
     * @param id the id of the entity.
     */
    @CacheEvict(cacheNames = "main.domain.Allergene", allEntries = true)
    public void delete(UUID id) {
        LOG.debug("Request to delete Allergene : {}", id);
        allergeneRepository.deleteById(id);
    }
}
