package main.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import main.domain.Menu;
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
}
