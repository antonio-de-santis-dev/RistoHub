package main.repository;

import java.util.List;
import java.util.UUID;
import main.domain.ImmagineMenu;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the ImmagineMenu entity.
 */
@SuppressWarnings("unused")
@Repository
public interface ImmagineMenuRepository extends JpaRepository<ImmagineMenu, UUID> {
    /** Tutte le immagini di un menu ordinate per ordine crescente */
    List<ImmagineMenu> findByMenuIdOrderByOrdine(UUID menuId);

    /** Compatibilità con il metodo originale — delega all'ordinato */
    default List<ImmagineMenu> findByMenuId(UUID menuId) {
        return findByMenuIdOrderByOrdine(menuId);
    }

    /** Conta TUTTE le immagini di un menu */
    long countByMenuId(UUID menuId);

    /** Conta solo le immagini di un tipo specifico (es. COPERTINA) — usato per il limite dei 5 slot */
    long countByMenuIdAndTipo(UUID menuId, main.domain.enumeration.TipoImmagine tipo);

    /** Solo immagini visibili, ordinate — usato dal menu-view pubblico */
    List<ImmagineMenu> findByMenuIdAndVisibileOrderByOrdine(UUID menuId, Boolean visibile);

    @Modifying
    @Query("UPDATE ImmagineMenu i SET i.ordine = :ordine, i.visibile = :visibile " + "WHERE i.id = :id AND i.menu.id = :menuId")
    int updateOrdineAndVisibile(
        @Param("id") UUID id,
        @Param("menuId") UUID menuId,
        @Param("ordine") Integer ordine,
        @Param("visibile") Boolean visibile
    );

    @Query(
        "SELECT i.id AS id, i.nome AS nome, i.immagineContentType AS immagineContentType, " +
        "i.tipo AS tipo, i.ordine AS ordine, i.visibile AS visibile " +
        "FROM ImmagineMenu i WHERE i.menu.id = :menuId ORDER BY i.ordine ASC"
    )
    List<ImmagineMenuMeta> findMetaByMenuId(@Param("menuId") UUID menuId);

    interface ImmagineMenuMeta {
        UUID getId();
        String getNome();
        String getImmagineContentType();
        String getTipo();
        Integer getOrdine();
        Boolean getVisibile();
    }
}
