package main.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.domain.Menu;
import main.domain.PiattoDelGiorno;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Menu entity.
 */
@Repository
public interface MenuRepository extends JpaRepository<Menu, UUID> {
    @Query("select menu from Menu menu where menu.ristoratore.login = ?#{authentication.name}")
    List<Menu> findByRistoratoreIsCurrentUser();

    default Optional<Menu> findOneWithEagerRelationships(UUID id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<Menu> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<Menu> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(value = "select menu from Menu menu left join fetch menu.ristoratore", countQuery = "select count(menu) from Menu menu")
    Page<Menu> findAllWithToOneRelationships(Pageable pageable);

    @Query("select menu from Menu menu left join fetch menu.ristoratore")
    List<Menu> findAllWithToOneRelationships();

    @Query("select menu from Menu menu left join fetch menu.ristoratore where menu.id =:id")
    Optional<Menu> findOneWithToOneRelationships(@Param("id") UUID id);

    /**
     * Passo 1 — piatti attivi del menu con prodotto collegato.
     */
    @Query("SELECT DISTINCT p FROM PiattoDelGiorno p " + "LEFT JOIN FETCH p.prodotto " + "WHERE p.attivo = true AND p.menu.id = :menuId")
    List<PiattoDelGiorno> findPiattiDelGiornoAttiviByMenuId(@Param("menuId") UUID menuId);

    /**
     * Passo 2 — stessi piatti con allergeni del prodotto collegato.
     * Query separata per evitare MultipleBagFetchException.
     * Hibernate 1st-level cache aggiorna le stesse istanze in memoria.
     */
    @Query(
        "SELECT DISTINCT p FROM PiattoDelGiorno p " +
        "LEFT JOIN FETCH p.prodotto prod " +
        "LEFT JOIN FETCH prod.allergenis " +
        "WHERE p.attivo = true AND p.menu.id = :menuId AND p.prodotto IS NOT NULL"
    )
    List<PiattoDelGiorno> findPiattiDelGiornoAttiviByMenuIdConAllergeniProdotto(@Param("menuId") UUID menuId);

    /**
     * Passo 3 — stessi piatti con allergeni diretti (piatti personalizzati).
     * Query separata per evitare MultipleBagFetchException.
     */
    @Query("SELECT DISTINCT p FROM PiattoDelGiorno p " + "LEFT JOIN FETCH p.allergenis " + "WHERE p.attivo = true AND p.menu.id = :menuId")
    List<PiattoDelGiorno> findPiattiDelGiornoAttiviByMenuIdConAllergeniDiretti(@Param("menuId") UUID menuId);
}
