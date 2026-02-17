package main.service;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.ImmagineMenu;
import main.repository.ImmagineMenuRepository;
import main.service.dto.ImmagineMenuDTO;
import main.service.mapper.ImmagineMenuMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link main.domain.ImmagineMenu}.
 */
@Service
@Transactional
public class ImmagineMenuService {

    private static final Logger LOG = LoggerFactory.getLogger(ImmagineMenuService.class);

    private final ImmagineMenuRepository immagineMenuRepository;

    private final ImmagineMenuMapper immagineMenuMapper;

    public ImmagineMenuService(ImmagineMenuRepository immagineMenuRepository, ImmagineMenuMapper immagineMenuMapper) {
        this.immagineMenuRepository = immagineMenuRepository;
        this.immagineMenuMapper = immagineMenuMapper;
    }

    /**
     * Save a immagineMenu.
     *
     * @param immagineMenuDTO the entity to save.
     * @return the persisted entity.
     */
    public ImmagineMenuDTO save(ImmagineMenuDTO immagineMenuDTO) {
        LOG.debug("Request to save ImmagineMenu : {}", immagineMenuDTO);
        ImmagineMenu immagineMenu = immagineMenuMapper.toEntity(immagineMenuDTO);
        immagineMenu = immagineMenuRepository.save(immagineMenu);
        return immagineMenuMapper.toDto(immagineMenu);
    }

    /**
     * Update a immagineMenu.
     *
     * @param immagineMenuDTO the entity to save.
     * @return the persisted entity.
     */
    public ImmagineMenuDTO update(ImmagineMenuDTO immagineMenuDTO) {
        LOG.debug("Request to update ImmagineMenu : {}", immagineMenuDTO);
        ImmagineMenu immagineMenu = immagineMenuMapper.toEntity(immagineMenuDTO);
        immagineMenu = immagineMenuRepository.save(immagineMenu);
        return immagineMenuMapper.toDto(immagineMenu);
    }

    /**
     * Partially update a immagineMenu.
     *
     * @param immagineMenuDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<ImmagineMenuDTO> partialUpdate(ImmagineMenuDTO immagineMenuDTO) {
        LOG.debug("Request to partially update ImmagineMenu : {}", immagineMenuDTO);

        return immagineMenuRepository
            .findById(immagineMenuDTO.getId())
            .map(existingImmagineMenu -> {
                immagineMenuMapper.partialUpdate(existingImmagineMenu, immagineMenuDTO);

                return existingImmagineMenu;
            })
            .map(immagineMenuRepository::save)
            .map(immagineMenuMapper::toDto);
    }

    /**
     * Get all the immagineMenus.
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<ImmagineMenuDTO> findAll() {
        LOG.debug("Request to get all ImmagineMenus");
        return immagineMenuRepository.findAll().stream().map(immagineMenuMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get one immagineMenu by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<ImmagineMenuDTO> findOne(UUID id) {
        LOG.debug("Request to get ImmagineMenu : {}", id);
        return immagineMenuRepository.findById(id).map(immagineMenuMapper::toDto);
    }

    /**
     * Delete the immagineMenu by id.
     *
     * @param id the id of the entity.
     */
    public void delete(UUID id) {
        LOG.debug("Request to delete ImmagineMenu : {}", id);
        immagineMenuRepository.deleteById(id);
    }
}
