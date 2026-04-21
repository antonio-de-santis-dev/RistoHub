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
    List<Prodotto> findByPortataId(UUID portataId);

    /**
     * Restituisce tutti i prodotti appartenenti alle portate di un dato menu,
     * con gli allergeni già inizializzati (evita N+1 sul join allergenis).
     */
    @Query("SELECT DISTINCT p FROM Prodotto p " + "LEFT JOIN FETCH p.allergenis " + "WHERE p.portata.menu.id = :menuId")
    List<Prodotto> findByPortataMenuIdWithAllergeni(@Param("menuId") UUID menuId);

    @Query("SELECT p.portata.menu.ristoratore.login FROM Prodotto p WHERE p.id = :id")
    Optional<String> findRistoratoreLoginByProdottoId(@Param("id") UUID id);

    /**
     * Restituisce l'id del menu a cui appartiene un prodotto. Usato per invalidare
     * la cache "menuCompleto" dopo save/update/delete del prodotto.
     */
    @Query("SELECT p.portata.menu.id FROM Prodotto p WHERE p.id = :id")
    Optional<UUID> findMenuIdByProdottoId(@Param("id") UUID id);

    /**
     * Restituisce tutti i prodotti di un menu che non hanno ancora traduzioni
     * (campo traduzioni null o vuoto). Usato dal fallback endpoint per tradurre
     * prodotti legacy creati prima dell'attivazione di DeepL.
     */
    @Query("SELECT p FROM Prodotto p WHERE p.portata.menu.id = :menuId " + "AND (p.traduzioni IS NULL OR p.traduzioni = '')")
    List<Prodotto> findProdottiSenzaTraduzioniByMenuId(@Param("menuId") UUID menuId);

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
