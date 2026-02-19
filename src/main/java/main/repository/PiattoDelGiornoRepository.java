package main.repository;

import java.util.List;
import java.util.UUID;
import main.domain.PiattoDelGiorno;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the PiattoDelGiorno entity.
 */
@SuppressWarnings("unused")
@Repository
public interface PiattoDelGiornoRepository extends JpaRepository<PiattoDelGiorno, UUID> {
    List<PiattoDelGiorno> findByAttivo(Boolean attivo);
}
