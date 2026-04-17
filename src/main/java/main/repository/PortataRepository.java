package main.repository;

import java.util.List;
import java.util.UUID;
import main.domain.Portata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Portata entity.
 */
@SuppressWarnings("unused")
@Repository
public interface PortataRepository extends JpaRepository<Portata, UUID> {
    /**
     * OPT-11: ordina direttamente in DB — evita lo stream sort in memoria.
     * DEFAULT prima (nell'ordine dell'enum NomePortataDefault), poi PERSONALIZZATA.
     */
    @Query(
        "SELECT p FROM Portata p WHERE p.menu.id = :menuId ORDER BY CASE p.tipo WHEN 'DEFAULT' THEN 0 ELSE 1 END, CASE p.nomeDefault WHEN 'ANTIPASTO' THEN 0 WHEN 'PRIMO' THEN 1 WHEN 'SECONDO' THEN 2 WHEN 'CONTORNO' THEN 3 WHEN 'DOLCE' THEN 4 WHEN 'BEVANDA' THEN 5 WHEN 'VINO_ROSSO' THEN 6 WHEN 'VINO_BIANCO' THEN 7 WHEN 'VINO_ROSATO' THEN 8 WHEN 'BIRRA' THEN 9 WHEN 'DIGESTIVO' THEN 10 ELSE 99 END"
    )
    List<Portata> findByMenuIdOrdered(@Param("menuId") UUID menuId);

    @Query("SELECT p FROM Portata p WHERE p.menu.id = :menuId")
    List<Portata> findByMenuId(@Param("menuId") UUID menuId);
}
