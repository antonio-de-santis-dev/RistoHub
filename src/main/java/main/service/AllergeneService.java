package main.service;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.Allergene;
import main.repository.AllergeneRepository;
import main.service.dto.AllergeneDTO;
import main.service.mapper.AllergeneMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    public AllergeneDTO save(AllergeneDTO allergeneDTO) {
        LOG.debug("Request to save Allergene : {}", allergeneDTO);
        Allergene allergene = allergeneMapper.toEntity(allergeneDTO);
        allergene = allergeneRepository.save(allergene);
        return allergeneMapper.toDto(allergene);
    }

    /**
     * Update a allergene.
     *
     * @param allergeneDTO the entity to save.
     * @return the persisted entity.
     */
    public AllergeneDTO update(AllergeneDTO allergeneDTO) {
        LOG.debug("Request to update Allergene : {}", allergeneDTO);
        Allergene allergene = allergeneMapper.toEntity(allergeneDTO);
        allergene = allergeneRepository.save(allergene);
        return allergeneMapper.toDto(allergene);
    }

    /**
     * Partially update a allergene.
     *
     * @param allergeneDTO the entity to update partially.
     * @return the persisted entity.
     */
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
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<AllergeneDTO> findAll() {
        LOG.debug("Request to get all Allergenes");
        return allergeneRepository.findAll().stream().map(allergeneMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
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
    public void delete(UUID id) {
        LOG.debug("Request to delete Allergene : {}", id);
        allergeneRepository.deleteById(id);
    }
}
