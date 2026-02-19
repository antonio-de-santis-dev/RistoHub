package main.service;

import java.time.LocalDate;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.PiattoDelGiorno;
import main.repository.PiattoDelGiornoRepository;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.mapper.PiattoDelGiornoMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link main.domain.PiattoDelGiorno}.
 */
@Service
@Transactional
public class PiattoDelGiornoService {

    private static final Logger LOG = LoggerFactory.getLogger(PiattoDelGiornoService.class);

    private final PiattoDelGiornoRepository piattoDelGiornoRepository;

    private final PiattoDelGiornoMapper piattoDelGiornoMapper;

    public PiattoDelGiornoService(PiattoDelGiornoRepository piattoDelGiornoRepository, PiattoDelGiornoMapper piattoDelGiornoMapper) {
        this.piattoDelGiornoRepository = piattoDelGiornoRepository;
        this.piattoDelGiornoMapper = piattoDelGiornoMapper;
    }

    /**
     * Save a piattoDelGiorno.
     *
     * @param piattoDelGiornoDTO the entity to save.
     * @return the persisted entity.
     */
    public PiattoDelGiornoDTO save(PiattoDelGiornoDTO piattoDelGiornoDTO) {
        LOG.debug("Request to save PiattoDelGiorno : {}", piattoDelGiornoDTO);

        if (piattoDelGiornoDTO.getData() == null) {
            piattoDelGiornoDTO.setData(LocalDate.now());
        }

        PiattoDelGiorno piattoDelGiorno = piattoDelGiornoMapper.toEntity(piattoDelGiornoDTO);
        piattoDelGiorno = piattoDelGiornoRepository.save(piattoDelGiorno);
        return piattoDelGiornoMapper.toDto(piattoDelGiorno);
    }

    /**
     * Update a piattoDelGiorno.
     *
     * @param piattoDelGiornoDTO the entity to save.
     * @return the persisted entity.
     */
    public PiattoDelGiornoDTO update(PiattoDelGiornoDTO piattoDelGiornoDTO) {
        LOG.debug("Request to update PiattoDelGiorno : {}", piattoDelGiornoDTO);
        PiattoDelGiorno piattoDelGiorno = piattoDelGiornoMapper.toEntity(piattoDelGiornoDTO);
        piattoDelGiorno = piattoDelGiornoRepository.save(piattoDelGiorno);
        return piattoDelGiornoMapper.toDto(piattoDelGiorno);
    }

    /**
     * Partially update a piattoDelGiorno.
     *
     * @param piattoDelGiornoDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<PiattoDelGiornoDTO> partialUpdate(PiattoDelGiornoDTO piattoDelGiornoDTO) {
        LOG.debug("Request to partially update PiattoDelGiorno : {}", piattoDelGiornoDTO);

        return piattoDelGiornoRepository
            .findById(piattoDelGiornoDTO.getId())
            .map(existingPiattoDelGiorno -> {
                piattoDelGiornoMapper.partialUpdate(existingPiattoDelGiorno, piattoDelGiornoDTO);

                return existingPiattoDelGiorno;
            })
            .map(piattoDelGiornoRepository::save)
            .map(piattoDelGiornoMapper::toDto);
    }

    /**
     * Get all the piattoDelGiornos.
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<PiattoDelGiornoDTO> findAll() {
        LOG.debug("Request to get all PiattoDelGiornos");
        return piattoDelGiornoRepository
            .findAll()
            .stream()
            .map(piattoDelGiornoMapper::toDto)
            .collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get one piattoDelGiorno by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<PiattoDelGiornoDTO> findOne(UUID id) {
        LOG.debug("Request to get PiattoDelGiorno : {}", id);
        return piattoDelGiornoRepository.findById(id).map(piattoDelGiornoMapper::toDto);
    }

    /**
     * Delete the piattoDelGiorno by id.
     *
     * @param id the id of the entity.
     */
    public void delete(UUID id) {
        LOG.debug("Request to delete PiattoDelGiorno : {}", id);
        piattoDelGiornoRepository.deleteById(id);
    }
}
