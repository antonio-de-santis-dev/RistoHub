package main.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.domain.Prodotto;
import main.repository.ProdottoRepository;
import main.security.SecurityUtils;
import main.service.dto.ProdottoDTO;
import main.service.mapper.ProdottoMapper;
import main.web.rest.errors.BadRequestAlertException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
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
     * FIX Bug 2: @Caching evict invalida la cache menuCompleto e piattiGiorno
     * dopo ogni scrittura, così il menu pubblico riflette subito le modifiche.
     *
     * @param prodottoDTO the entity to save.
     * @return the persisted entity.
     */
    @Caching(evict = { @CacheEvict(value = "menuCompleto", allEntries = true), @CacheEvict(value = "piattiGiorno", allEntries = true) })
    public ProdottoDTO save(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to save Prodotto : {}", prodottoDTO);
        return persistProdotto(prodottoDTO);
    }

    /**
     * Update a prodotto.
     *
     * FIX Bug 2: @Caching evict invalida la cache menuCompleto e piattiGiorno
     * dopo ogni scrittura, così il menu pubblico riflette subito le modifiche.
     *
     * @param prodottoDTO the entity to save.
     * @return the persisted entity.
     */
    @Caching(evict = { @CacheEvict(value = "menuCompleto", allEntries = true), @CacheEvict(value = "piattiGiorno", allEntries = true) })
    public ProdottoDTO update(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to update Prodotto : {}", prodottoDTO);
        checkProdottoOwnership(prodottoDTO.getId());
        return persistProdotto(prodottoDTO);
    }

    // OPT-10: metodo privato condiviso — evita duplicazione tra save() e update()
    private ProdottoDTO persistProdotto(ProdottoDTO dto) {
        Prodotto prodotto = prodottoMapper.toEntity(dto);
        return prodottoMapper.toDto(prodottoRepository.save(prodotto));
    }

    /**
     * Partially update a prodotto.
     *
     * Usato dal frontend per il toggle visibilità (PATCH con solo id + visibile).
     *
     * FIX Bug 2: @Caching evict invalida la cache menuCompleto e piattiGiorno
     * così il menu pubblico nasconde/mostra subito il prodotto senza attendere
     * la scadenza naturale della cache.
     *
     * FIX Bug 3: funziona correttamente ora che visibile è Boolean wrapper
     * (non più boolean primitivo): NullValuePropertyMappingStrategy.IGNORE nel
     * mapper può distinguere null (= campo non inviato, da preservare) da false.
     *
     * @param prodottoDTO the entity to update partially.
     * @return the persisted entity.
     */
    @Caching(evict = { @CacheEvict(value = "menuCompleto", allEntries = true), @CacheEvict(value = "piattiGiorno", allEntries = true) })
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
        return prodottoRepository.findAll().stream().map(prodottoMapper::toDto).toList();
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
     * FIX Bug 2: @Caching evict invalida la cache anche alla cancellazione.
     *
     * @param id the id of the entity.
     */
    @Caching(evict = { @CacheEvict(value = "menuCompleto", allEntries = true), @CacheEvict(value = "piattiGiorno", allEntries = true) })
    public void delete(UUID id) {
        LOG.debug("Request to delete Prodotto : {}", id);
        checkProdottoOwnership(id);
        prodottoRepository.deleteById(id);
    }

    private void checkProdottoOwnership(UUID prodottoId) {
        String currentLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new BadRequestAlertException("Utente non autenticato", "prodotto", "unauthenticated"));
        String ownerLogin = prodottoRepository
            .findRistoratoreLoginByProdottoId(prodottoId)
            .orElseThrow(() -> new BadRequestAlertException("Prodotto non trovato", "prodotto", "idnotfound"));
        if (!ownerLogin.equals(currentLogin)) {
            throw new BadRequestAlertException("Accesso negato", "prodotto", "forbidden");
        }
    }

    public List<ProdottoDTO> findByPortataId(UUID portataId) {
        return prodottoRepository.findByPortataId(portataId).stream().map(prodottoMapper::toDto).toList();
    }

    /**
     * Restituisce tutti i prodotti VISIBILI delle portate di un menu con allergeni già caricati.
     * Usato da GET /api/menus/{id}/prodotti-completi — elimina il loop N+1 lato frontend.
     *
     * FIX Bug 1: la query ora filtra per p.visibile = true (fix in ProdottoRepository).
     */
    @Transactional(readOnly = true)
    public List<ProdottoDTO> findProdottiCompletiByMenuId(UUID menuId) {
        LOG.debug("Request to get all Prodotti visibili with allergeni for Menu : {}", menuId);
        return prodottoRepository.findByPortataMenuIdWithAllergeni(menuId).stream().map(prodottoMapper::toDto).toList();
    }
}
