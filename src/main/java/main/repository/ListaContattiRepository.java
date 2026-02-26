package main.repository;

import java.util.List;
import java.util.UUID;
import main.domain.ListaContatti;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository per {@link ListaContatti}.
 */
@Repository
public interface ListaContattiRepository extends JpaRepository<ListaContatti, UUID> {
    /**
     * Tutte le liste dell'utente correntemente autenticato.
     * Funziona per qualsiasi utente registrato (ROLE_USER o ROLE_ADMIN).
     */
    @Query("SELECT lc FROM ListaContatti lc WHERE lc.ristoratore.login = ?#{authentication.name}")
    List<ListaContatti> findByRistoratoreIsCurrentUser();

    /**
     * Liste associate a un determinato menu.
     * Usato dal menu-view pubblico per caricare i contatti da mostrare al cliente.
     */
    @Query("SELECT lc FROM ListaContatti lc JOIN lc.menuIds mid WHERE mid = :menuId")
    List<ListaContatti> findByMenuId(@Param("menuId") UUID menuId);
}
