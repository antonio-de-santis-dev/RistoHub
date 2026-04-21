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

    @Query("SELECT DISTINCT p FROM PiattoDelGiorno p LEFT JOIN FETCH p.prodotto")
    List<PiattoDelGiorno> findAllConProdotto();

    @Query(
        "SELECT DISTINCT p FROM PiattoDelGiorno p " +
        "LEFT JOIN FETCH p.prodotto prod " +
        "LEFT JOIN FETCH prod.allergenis " +
        "WHERE p.prodotto IS NOT NULL"
    )
    List<PiattoDelGiorno> findAllConAllergeniProdotto();

    @Query("SELECT DISTINCT p FROM PiattoDelGiorno p LEFT JOIN FETCH p.allergenis")
    List<PiattoDelGiorno> findAllConAllergeniDiretti();

    @Query("SELECT p FROM PiattoDelGiorno p WHERE p.menu.ristoratore.login = :login")
    List<PiattoDelGiorno> findByMenuRistoratoreLogin(@Param("login") String login);

    /**
     * Ritorna i piatti del giorno di un menu che non hanno ancora traduzioni.
     * Usato dall'endpoint di fallback /api/public/menus/{id}/translate-missing.
     */
    @Query("SELECT p FROM PiattoDelGiorno p WHERE p.menu.id = :menuId " + "AND (p.traduzioni IS NULL OR p.traduzioni = '')")
    List<PiattoDelGiorno> findByMenuIdWithNullTraduzioni(@Param("menuId") UUID menuId);
}
