package main.service;

import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.Prodotto;
import main.repository.ProdottoRepository;
import main.service.dto.ProdottoDTO;
import main.service.mapper.ProdottoMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link main.domain.Prodotto}.
 */
@Service
@Transactional
public class ProdottoService {

    private static final Logger LOG = LoggerFactory.getLogger(ProdottoService.class);

    private final ProdottoRepository prodottoRepository;

    private final ProdottoMapper prodottoMapper;

    public ProdottoService(ProdottoRepository prodottoRepository, ProdottoMapper prodottoMapper) {
        this.prodottoRepository = prodottoRepository;
        this.prodottoMapper = prodottoMapper;
    }

    /**
     * Save a prodotto.
     *
     * @param prodottoDTO the entity to save.
     * @return the persisted entity.
     */
    public ProdottoDTO save(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to save Prodotto : {}", prodottoDTO);
        Prodotto prodotto = prodottoMapper.toEntity(prodottoDTO);
        prodotto = prodottoRepository.save(prodotto);
        return prodottoMapper.toDto(prodotto);
    }

    /**
     * Update a prodotto.
     *
     * @param prodottoDTO the entity to save.
     * @return the persisted entity.
     */
    public ProdottoDTO update(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to update Prodotto : {}", prodottoDTO);
        Prodotto prodotto = prodottoMapper.toEntity(prodottoDTO);
        prodotto = prodottoRepository.save(prodotto);
        return prodottoMapper.toDto(prodotto);
    }

    /**
     * Partially update a prodotto.
     *
     * @param prodottoDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<ProdottoDTO> partialUpdate(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to partially update Prodotto : {}", prodottoDTO);

        return prodottoRepository
            .findById(prodottoDTO.getId())
            .map(existingProdotto -> {
                prodottoMapper.partialUpdate(existingProdotto, prodottoDTO);

                return existingProdotto;
            })
            .map(prodottoRepository::save)
            .map(prodottoMapper::toDto);
    }

    /**
     * Get all the prodottos.
     *
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public List<ProdottoDTO> findAll() {
        LOG.debug("Request to get all Prodottos");
        return prodottoRepository.findAll().stream().map(prodottoMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    /**
     * Get all the prodottos with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<ProdottoDTO> findAllWithEagerRelationships(Pageable pageable) {
        return prodottoRepository.findAllWithEagerRelationships(pageable).map(prodottoMapper::toDto);
    }

    /**
     * Get one prodotto by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<ProdottoDTO> findOne(UUID id) {
        LOG.debug("Request to get Prodotto : {}", id);
        return prodottoRepository.findOneWithEagerRelationships(id).map(prodottoMapper::toDto);
    }

    /**
     * Delete the prodotto by id.
     *
     * @param id the id of the entity.
     */
    public void delete(UUID id) {
        LOG.debug("Request to delete Prodotto : {}", id);
        prodottoRepository.deleteById(id);
    }

    public List<ProdottoDTO> findByPortataId(UUID portataId) {
        return prodottoRepository.findByPortataId(portataId).stream().map(prodottoMapper::toDto).collect(Collectors.toList());
    }
}
