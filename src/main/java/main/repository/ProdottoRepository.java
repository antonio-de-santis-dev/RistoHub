package main.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.domain.Prodotto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Prodotto entity.
 *
 * When extending this class, extend ProdottoRepositoryWithBagRelationships too.
 * For more information refer to https://github.com/jhipster/generator-jhipster/issues/17990.
 */
@Repository
public interface ProdottoRepository extends ProdottoRepositoryWithBagRelationships, JpaRepository<Prodotto, UUID> {
    /** Tutti i prodotti di una portata (backoffice — include anche quelli nascosti). */
    List<Prodotto> findByPortataId(UUID portataId);

    /**
     * Prodotti di una portata VISIBILI nel menu pubblico (visibile = true).
     * Usato dagli endpoint /api/public/** per filtrare cosa mostrare al cliente.
     */
    List<Prodotto> findByPortataIdAndVisibileTrue(UUID portataId);

    /**
     * Restituisce tutti i prodotti appartenenti alle portate di un dato menu,
     * con gli allergeni già inizializzati (evita N+1 sul join allergenis).
     * Usato da GET /api/menus/{id}/prodotti-completi (backoffice — include tutti).
     */
    @Query("SELECT DISTINCT p FROM Prodotto p " + "LEFT JOIN FETCH p.allergenis " + "WHERE p.portata.menu.id = :menuId")
    List<Prodotto> findByPortataMenuIdWithAllergeni(@Param("menuId") UUID menuId);

    /**
     * Stessa query ma filtra solo i prodotti visibili (visibile = true).
     * Usato dal menu pubblico (endpoint /api/public/menus/{id}/full e by-portata).
     */
    @Query(
        "SELECT DISTINCT p FROM Prodotto p " + "LEFT JOIN FETCH p.allergenis " + "WHERE p.portata.menu.id = :menuId AND p.visibile = true"
    )
    List<Prodotto> findByPortataMenuIdWithAllergeniAndVisibile(@Param("menuId") UUID menuId);

    default Optional<Prodotto> findOneWithEagerRelationships(UUID id) {
        return this.fetchBagRelationships(this.findById(id));
    }

    default List<Prodotto> findAllWithEagerRelationships() {
        return this.fetchBagRelationships(this.findAll());
    }

    default Page<Prodotto> findAllWithEagerRelationships(Pageable pageable) {
        return this.fetchBagRelationships(this.findAll(pageable));
    }
}
