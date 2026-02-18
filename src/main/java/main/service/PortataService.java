package main.service;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.Portata;
import main.repository.PortataRepository;
import main.service.dto.PortataDTO;
import main.service.mapper.PortataMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link main.domain.Portata}.
 */
@Service
@Transactional
public class PortataService {

    private static final Logger LOG = LoggerFactory.getLogger(PortataService.class);

    private final PortataRepository portataRepository;

    private final PortataMapper portataMapper;

    public PortataService(PortataRepository portataRepository, PortataMapper portataMapper) {
        this.portataRepository = portataRepository;
        this.portataMapper = portataMapper;
    }

    /**
     * Save a portata.
     *
     * @param portataDTO the entity to save.
     * @return the persisted entity.
     */
    public PortataDTO save(PortataDTO portataDTO) {
        LOG.debug("Request to save Portata : {}", portataDTO);
        Portata portata = portataMapper.toEntity(portataDTO);
        portata = portataRepository.save(portata);
        return portataMapper.toDto(portata);
    }

    /**
     * Update a portata.
     *
     * @param portataDTO the entity to save.
     * @return the persisted entity.
     */
    public PortataDTO update(PortataDTO portataDTO) {
        LOG.debug("Request to update Portata : {}", portataDTO);
        Portata portata = portataMapper.toEntity(portataDTO);
        portata = portataRepository.save(portata);
        return portataMapper.toDto(portata);
    }

    /**
     * Partially update a portata.
     *
     * @param portataDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<PortataDTO> partialUpdate(PortataDTO portataDTO) {
        LOG.debug("Request to partially update Portata : {}", portataDTO);

        return portataRepository
            .findById(portataDTO.getId())
            .map(existingPortata -> {
                portataMapper.partialUpdate(existingPortata, portataDTO);

                return existingPortata;
            })
            .map(portataRepository::save)
            .map(portataMapper::toDto);
    }

    /**
     * Get all the portatas.
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<PortataDTO> findAll() {
        LOG.debug("Request to get all Portatas");
        return portataRepository.findAll().stream().map(portataMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get one portata by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<PortataDTO> findOne(UUID id) {
        LOG.debug("Request to get Portata : {}", id);
        return portataRepository.findById(id).map(portataMapper::toDto);
    }

    /**
     * Delete the portata by id.
     *
     * @param id the id of the entity.
     */
    public void delete(UUID id) {
        LOG.debug("Request to delete Portata : {}", id);
        portataRepository.deleteById(id);
    }

    public List<PortataDTO> findByMenuId(UUID menuId) {
        return portataRepository.findByMenuId(menuId).stream().map(portataMapper::toDto).collect(Collectors.toList());
    }
}
