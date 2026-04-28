package main.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link main.domain.Prodotto}.
 */
@Service
@Transactional
public class ProdottoService {

    private static final Logger LOG = LoggerFactory.getLogger(ProdottoService.class);

    /** Lingue supportate per la traduzione automatica. */
    private static final List<String> LINGUE_SUPPORTATE = List.of("en", "fr", "de", "es");

    private final ProdottoRepository prodottoRepository;
    private final ProdottoMapper prodottoMapper;
    private final TraduzioneProxyService traduzioneProxyService;

    public ProdottoService(
        ProdottoRepository prodottoRepository,
        ProdottoMapper prodottoMapper,
        TraduzioneProxyService traduzioneProxyService
    ) {
        this.prodottoRepository = prodottoRepository;
        this.prodottoMapper = prodottoMapper;
        this.traduzioneProxyService = traduzioneProxyService;
    }

    /**
     * Save a prodotto.
     *
     * Dopo il salvataggio, lancia in modo asincrono la generazione delle traduzioni.
     *
     * @param prodottoDTO the entity to save.
     * @return the persisted entity.
     */
    @Caching(evict = { @CacheEvict(value = "menuCompleto", allEntries = true), @CacheEvict(value = "piattiGiorno", allEntries = true) })
    public ProdottoDTO save(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to save Prodotto : {}", prodottoDTO);
        ProdottoDTO saved = persistProdotto(prodottoDTO);
        // Genera e salva le traduzioni in background (non blocca la risposta HTTP)
        generaEsalvaTraduzioniAsync(saved.getId(), saved.getNome(), saved.getDescrizione());
        return saved;
    }

    /**
     * Salva una lista di prodotti in batch — usato esclusivamente dall'import PDF.
     *
     * Dopo il salvataggio, lancia in modo asincrono la generazione delle traduzioni
     * per tutti i prodotti importati (tutte le lingue in un unico batch ottimizzato).
     *
     * @param prodottoDTOs lista di prodotti da salvare
     * @return lista dei prodotti salvati con ID assegnato
     */
    @Caching(evict = { @CacheEvict(value = "menuCompleto", allEntries = true), @CacheEvict(value = "piattiGiorno", allEntries = true) })
    public List<ProdottoDTO> saveAll(List<ProdottoDTO> prodottoDTOs) {
        LOG.debug("Request to batch-save {} Prodotti", prodottoDTOs.size());
        List<Prodotto> entities = prodottoDTOs.stream().map(prodottoMapper::toEntity).toList();
        List<ProdottoDTO> saved = prodottoRepository.saveAll(entities).stream().map(prodottoMapper::toDto).toList();
        // Genera traduzioni per tutti i prodotti salvati in un unico batch asincrono
        generaEsalvaTraduzioniPerListaAsync(saved);
        return saved;
    }

    /**
     * Update a prodotto.
     *
     * Rigenera le traduzioni se nome o descrizione sono cambiati.
     *
     * @param prodottoDTO the entity to save.
     * @return the persisted entity.
     */
    @Caching(evict = { @CacheEvict(value = "menuCompleto", allEntries = true), @CacheEvict(value = "piattiGiorno", allEntries = true) })
    public ProdottoDTO update(ProdottoDTO prodottoDTO) {
        LOG.debug("Request to update Prodotto : {}", prodottoDTO);
        checkProdottoOwnership(prodottoDTO.getId());
        ProdottoDTO updated = persistProdotto(prodottoDTO);
        // Rigenera le traduzioni (il testo potrebbe essere cambiato)
        generaEsalvaTraduzioniAsync(updated.getId(), updated.getNome(), updated.getDescrizione());
        return updated;
    }

    // OPT-10: metodo privato condiviso — evita duplicazione tra save() e update()
    private ProdottoDTO persistProdotto(ProdottoDTO dto) {
        Prodotto prodotto = prodottoMapper.toEntity(dto);
        return prodottoMapper.toDto(prodottoRepository.save(prodotto));
    }

    /**
     * Partially update a prodotto.
     *
     * NON rigenera le traduzioni: il partialUpdate è usato solo per il toggle
     * visibilità (PATCH con id + visibile), non modifica nome/descrizione.
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
     */
    public Page<ProdottoDTO> findAllWithEagerRelationships(Pageable pageable) {
        return prodottoRepository.findAllWithEagerRelationships(pageable).map(prodottoMapper::toDto);
    }

    /**
     * Get one prodotto by id.
     */
    @Transactional(readOnly = true)
    public Optional<ProdottoDTO> findOne(UUID id) {
        LOG.debug("Request to get Prodotto : {}", id);
        return prodottoRepository.findOneWithEagerRelationships(id).map(prodottoMapper::toDto);
    }

    /**
     * Delete the prodotto by id.
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
     */
    @Transactional(readOnly = true)
    public List<ProdottoDTO> findProdottiCompletiByMenuId(UUID menuId) {
        LOG.debug("Request to get all Prodotti visibili with allergeni for Menu : {}", menuId);
        return prodottoRepository.findByPortataMenuIdWithAllergeni(menuId).stream().map(prodottoMapper::toDto).toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Metodi privati: generazione asincrona delle traduzioni
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Genera e salva le traduzioni per un singolo prodotto, in modo asincrono.
     *
     * Viene chiamato dopo save() e update().
     * Usa @Async → viene eseguito in un thread separato, non blocca la risposta HTTP.
     *
     * Per ogni lingua supportata (en, fr, de, es):
     *   1. Traduce nome e descrizione in un unico batch (2 stringhe → 1 chiamata HTTP)
     *   2. Salva il risultato nella colonna traduzioni del prodotto
     *
     * @param prodottoId  UUID del prodotto appena salvato
     * @param nome        Nome del prodotto (sempre presente)
     * @param descrizione Descrizione del prodotto (può essere null)
     */
    @Async
    @Transactional
    public void generaEsalvaTraduzioniAsync(UUID prodottoId, String nome, String descrizione) {
        LOG.debug("Generazione traduzioni async per prodotto {}", prodottoId);

        if (!traduzioneProxyService.isDisponibile()) {
            LOG.warn("LibreTranslate non disponibile — traduzioni non generate per {}", prodottoId);
            return;
        }

        try {
            Map<String, Map<String, String>> traduzioni = new HashMap<>();

            for (String lingua : LINGUE_SUPPORTATE) {
                Map<String, String> traduzioneLingua = traduciNomeEDescrizione(nome, descrizione, lingua);
                if (!traduzioneLingua.isEmpty()) {
                    traduzioni.put(lingua, traduzioneLingua);
                }
            }

            if (!traduzioni.isEmpty()) {
                prodottoRepository
                    .findById(prodottoId)
                    .ifPresent(prodotto -> {
                        prodotto.setTraduzioni(traduzioni);
                        prodottoRepository.save(prodotto);
                        LOG.debug("Traduzioni salvate per prodotto {} (lingue: {})", prodottoId, traduzioni.keySet());
                    });
            }
        } catch (Exception e) {
            LOG.error("Errore generazione traduzioni per prodotto {}: {}", prodottoId, e.getMessage());
        }
    }

    /**
     * Genera e salva le traduzioni per una lista di prodotti, in modo asincrono.
     *
     * OTTIMIZZAZIONE per l'import PDF:
     * Invece di fare N chiamate separate (una per prodotto per lingua),
     * raccoglie tutti i testi unici per lingua e li traduce in un unico batch.
     *
     * Esempio: 100 prodotti × 4 lingue × 2 testi = 800 stringhe
     * → divise per lingua: 4 batch da 200 stringhe → 4 chiamate HTTP parallele
     * (il TraduzioneProxyService già gestisce il parallelismo interno per chunk).
     *
     * @param prodotti lista di prodotti già salvati con ID assegnato
     */
    @Async
    @Transactional
    public void generaEsalvaTraduzioniPerListaAsync(List<ProdottoDTO> prodotti) {
        LOG.debug("Generazione traduzioni async per {} prodotti", prodotti.size());

        if (prodotti.isEmpty()) return;

        if (!traduzioneProxyService.isDisponibile()) {
            LOG.warn("LibreTranslate non disponibile — traduzioni non generate per {} prodotti", prodotti.size());
            return;
        }

        try {
            for (String lingua : LINGUE_SUPPORTATE) {
                // Raccoglie tutti i testi unici da tradurre per questa lingua
                // (nomi + descrizioni in un unico batch)
                List<String> tuttiITesti = prodotti
                    .stream()
                    .flatMap(p -> {
                        List<String> testi = new java.util.ArrayList<>();
                        if (p.getNome() != null && !p.getNome().isBlank()) testi.add(p.getNome());
                        if (p.getDescrizione() != null && !p.getDescrizione().isBlank()) testi.add(p.getDescrizione());
                        return testi.stream();
                    })
                    .distinct()
                    .toList();

                if (tuttiITesti.isEmpty()) continue;

                // Traduce tutti i testi in un unico batch per questa lingua
                Map<String, String> traduzioniLingua = traduzioneProxyService.traduciBatch(tuttiITesti, lingua);

                // Salva le traduzioni per ogni prodotto
                for (ProdottoDTO dto : prodotti) {
                    String nomeTraddotto = traduzioniLingua.get(dto.getNome());
                    String descrizioneTraddotta = dto.getDescrizione() != null ? traduzioniLingua.get(dto.getDescrizione()) : null;

                    if (nomeTraddotto == null && descrizioneTraddotta == null) continue;

                    UUID prodottoId = dto.getId();
                    String linguaFinale = lingua; // effectively final per lambda

                    prodottoRepository
                        .findById(prodottoId)
                        .ifPresent(prodotto -> {
                            Map<String, Map<String, String>> traduzioni = prodotto.getTraduzioni();
                            if (traduzioni == null) traduzioni = new HashMap<>();

                            Map<String, String> entry = new HashMap<>();
                            if (nomeTraddotto != null && !nomeTraddotto.isBlank()) {
                                entry.put("nome", nomeTraddotto);
                            }
                            if (descrizioneTraddotta != null && !descrizioneTraddotta.isBlank()) {
                                entry.put("descrizione", descrizioneTraddotta);
                            }

                            if (!entry.isEmpty()) {
                                traduzioni.put(linguaFinale, entry);
                                prodotto.setTraduzioni(traduzioni);
                                prodottoRepository.save(prodotto);
                            }
                        });
                }

                LOG.debug("Traduzioni lingua '{}' salvate per {} prodotti", lingua, prodotti.size());
            }
        } catch (Exception e) {
            LOG.error("Errore generazione traduzioni batch per {} prodotti: {}", prodotti.size(), e.getMessage());
        }
    }

    /**
     * Traduce nome e descrizione di un prodotto per una singola lingua.
     *
     * Usa un batch di 2 stringhe (nome + descrizione) → 1 sola chiamata HTTP.
     *
     * @param nome        Nome del prodotto
     * @param descrizione Descrizione del prodotto (può essere null)
     * @param lingua      Lingua target (es. "en")
     * @return Map con "nome" e opzionalmente "descrizione" tradotti
     */
    private Map<String, String> traduciNomeEDescrizione(String nome, String descrizione, String lingua) {
        List<String> testi = new java.util.ArrayList<>();
        if (nome != null && !nome.isBlank()) testi.add(nome);
        if (descrizione != null && !descrizione.isBlank()) testi.add(descrizione);

        if (testi.isEmpty()) return Map.of();

        Map<String, String> risultati = traduzioneProxyService.traduciBatch(testi, lingua);

        Map<String, String> entry = new HashMap<>();
        if (nome != null && risultati.containsKey(nome)) {
            String t = risultati.get(nome);
            if (t != null && !t.isBlank()) entry.put("nome", t);
        }
        if (descrizione != null && risultati.containsKey(descrizione)) {
            String t = risultati.get(descrizione);
            if (t != null && !t.isBlank()) entry.put("descrizione", t);
        }
        return entry;
    }
}
