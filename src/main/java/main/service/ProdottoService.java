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
        return persistProdotto(prodottoDTO);
    }

    /**
     * Update a prodotto.
     *
     * @param prodottoDTO the entity to save.
     * @return the persisted entity.
     */
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
     * Inverte il flag `visibile` del prodotto specificato.
     *
     * Solo il ristoratore proprietario può modificare la visibilità.
     * Restituisce il DTO aggiornato con il nuovo valore di visibile.
     *
     * @param id UUID del prodotto da mostrare/nascondere
     * @return DTO aggiornato
     */
    public ProdottoDTO toggleVisibilita(UUID id) {
        LOG.debug("Request to toggle visibilità Prodotto : {}", id);
        checkProdottoOwnership(id);

        Prodotto prodotto = prodottoRepository
            .findById(id)
            .orElseThrow(() -> new BadRequestAlertException("Prodotto non trovato", "prodotto", "idnotfound"));

        // Inverte il flag; se per qualche motivo è null, lo considera true e lo nasconde
        boolean nuovoValore = prodotto.getVisibile() == null || !prodotto.getVisibile();
        prodotto.setVisibile(nuovoValore);

        return prodottoMapper.toDto(prodottoRepository.save(prodotto));
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
     * @param id the id of the entity.
     */
    public void delete(UUID id) {
        LOG.debug("Request to delete Prodotto : {}", id);
        checkProdottoOwnership(id);
        prodottoRepository.deleteById(id);
    }

    private void checkProdottoOwnership(UUID prodottoId) {
        String currentLogin = SecurityUtils.getCurrentUserLogin()
            .orElseThrow(() -> new BadRequestAlertException("Utente non autenticato", "prodotto", "unauthenticated"));
        Prodotto prodotto = prodottoRepository
            .findById(prodottoId)
            .orElseThrow(() -> new BadRequestAlertException("Prodotto non trovato", "prodotto", "idnotfound"));
        if (
            prodotto.getPortata() == null ||
            prodotto.getPortata().getMenu() == null ||
            prodotto.getPortata().getMenu().getRistoratore() == null ||
            !prodotto.getPortata().getMenu().getRistoratore().getLogin().equals(currentLogin)
        ) {
            throw new BadRequestAlertException("Accesso negato", "prodotto", "forbidden");
        }
    }

    /** Backoffice: tutti i prodotti di una portata (visibili e nascosti). */
    public List<ProdottoDTO> findByPortataId(UUID portataId) {
        return prodottoRepository.findByPortataId(portataId).stream().map(prodottoMapper::toDto).toList();
    }

    /**
     * Menu pubblico: solo i prodotti visibili di una portata.
     * Filtra per visibile = true.
     */
    public List<ProdottoDTO> findByPortataIdVisibili(UUID portataId) {
        return prodottoRepository.findByPortataIdAndVisibileTrue(portataId).stream().map(prodottoMapper::toDto).toList();
    }

    /**
     * Restituisce tutti i prodotti delle portate di un menu con allergeni già caricati.
     * Usato da GET /api/menus/{id}/prodotti-completi — elimina il loop N+1 lato frontend.
     * Backoffice: include tutti i prodotti (anche quelli nascosti).
     */
    @Transactional(readOnly = true)
    public List<ProdottoDTO> findProdottiCompletiByMenuId(UUID menuId) {
        LOG.debug("Request to get all Prodotti with allergeni for Menu : {}", menuId);
        return prodottoRepository.findByPortataMenuIdWithAllergeni(menuId).stream().map(prodottoMapper::toDto).toList();
    }

    /**
     * Stessa query ma filtra solo i prodotti visibili (visibile = true).
     * Usato dal menu pubblico aggregato per non esporre prodotti nascosti ai clienti.
     */
    @Transactional(readOnly = true)
    public List<ProdottoDTO> findProdottiCompletiVisibiliByMenuId(UUID menuId) {
        LOG.debug("Request to get visible Prodotti with allergeni for Menu : {}", menuId);
        return prodottoRepository.findByPortataMenuIdWithAllergeniAndVisibile(menuId).stream().map(prodottoMapper::toDto).toList();
    }
}
