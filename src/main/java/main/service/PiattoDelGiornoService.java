package main.service;

import java.time.LocalDate;
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
     */
    public PiattoDelGiornoDTO update(PiattoDelGiornoDTO piattoDelGiornoDTO) {
        LOG.debug("Request to update PiattoDelGiorno : {}", piattoDelGiornoDTO);
        PiattoDelGiorno piattoDelGiorno = piattoDelGiornoMapper.toEntity(piattoDelGiornoDTO);
        piattoDelGiorno = piattoDelGiornoRepository.save(piattoDelGiorno);
        return piattoDelGiornoMapper.toDto(piattoDelGiorno);
    }

    /**
     * Partially update a piattoDelGiorno.
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
     * Restituisce tutti i piatti del giorno con allergenis completamente popolati.
     *
     * Pattern a 3 query nella stessa transazione per evitare MultipleBagFetchException:
     *
     * Query 1 (findAllConProdotto): carica p + p.prodotto
     * Query 2 (findAllConAllergeniProdotto): carica p + p.prodotto + prodotto.allergenis
     * Query 3 (findAllConAllergeniDiretti): carica p + p.allergenis
     *
     * Hibernate 1st-level cache garantisce che tutte le query lavorino sulle stesse
     * istanze Java in memoria. Dopo le query 2 e 3, ogni entità ha le collection
     * inizializzate. Il mapper serializza tutto correttamente incluse icona e colore.
     */
    @Transactional(readOnly = true)
    public List<PiattoDelGiornoDTO> findAll() {
        LOG.debug("Request to get all PiattoDelGiornos with full allergenis");

        // Query 1: piatti + prodotto
        List<PiattoDelGiorno> baseList = piattoDelGiornoRepository.findAllConProdotto();

        // Query 2: inizializza prodotto.allergenis sulle istanze già in sessione
        piattoDelGiornoRepository.findAllConAllergeniProdotto();

        // Query 3: inizializza p.allergenis (piatti personalizzati) sulle istanze già in sessione
        piattoDelGiornoRepository.findAllConAllergeniDiretti();

        return baseList.stream().map(piattoDelGiornoMapper::toDto).collect(Collectors.toList());
    }

    /**
     * Get one piattoDelGiorno by id.
     */
    @Transactional(readOnly = true)
    public Optional<PiattoDelGiornoDTO> findOne(UUID id) {
        LOG.debug("Request to get PiattoDelGiorno : {}", id);
        return piattoDelGiornoRepository.findById(id).map(piattoDelGiornoMapper::toDto);
    }

    /**
     * Delete the piattoDelGiorno by id.
     */
    public void delete(UUID id) {
        LOG.debug("Request to delete PiattoDelGiorno : {}", id);
        piattoDelGiornoRepository.deleteById(id);
    }
}
