package main.repository;

import java.util.List;
import java.util.UUID;
import main.domain.Portata;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Portata entity.
 */
@SuppressWarnings("unused")
@Repository
public interface PortataRepository extends JpaRepository<Portata, UUID> {
    List<Portata> findByMenuId(UUID menuId);
}
