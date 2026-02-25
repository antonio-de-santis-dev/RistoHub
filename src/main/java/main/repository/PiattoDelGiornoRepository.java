package main.repository;

import java.util.List;
import java.util.UUID;
import main.domain.PiattoDelGiorno;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the PiattoDelGiorno entity.
 */
@SuppressWarnings("unused")
@Repository
public interface PiattoDelGiornoRepository extends JpaRepository<PiattoDelGiorno, UUID> {
    List<PiattoDelGiorno> findByAttivo(Boolean attivo);

    List<PiattoDelGiorno> findByMenuId(UUID menuId);

    void deleteByMenuId(UUID menuId);

    /**
     * Passo 1 — carica tutti i piatti con il prodotto collegato.
     * Query separata per evitare MultipleBagFetchException.
     */
    @Query("SELECT DISTINCT p FROM PiattoDelGiorno p LEFT JOIN FETCH p.prodotto")
    List<PiattoDelGiorno> findAllConProdotto();

    /**
     * Passo 2 — carica i piatti con gli allergeni del prodotto collegato.
     * Nella stessa transazione di findAllConProdotto(), Hibernate usa la 1st-level cache
     * e aggiorna le stesse istanze già in memoria.
     */
    @Query(
        "SELECT DISTINCT p FROM PiattoDelGiorno p " +
        "LEFT JOIN FETCH p.prodotto prod " +
        "LEFT JOIN FETCH prod.allergenis " +
        "WHERE p.prodotto IS NOT NULL"
    )
    List<PiattoDelGiorno> findAllConAllergeniProdotto();

    /**
     * Passo 3 — carica i piatti personalizzati con i loro allergeni diretti.
     * Nella stessa transazione, Hibernate popola p.allergenis sulle istanze già in cache.
     */
    @Query("SELECT DISTINCT p FROM PiattoDelGiorno p LEFT JOIN FETCH p.allergenis")
    List<PiattoDelGiorno> findAllConAllergeniDiretti();
}
