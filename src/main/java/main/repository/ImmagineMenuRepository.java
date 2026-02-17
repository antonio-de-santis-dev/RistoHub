package main.repository;

import java.util.UUID;
import main.domain.ImmagineMenu;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the ImmagineMenu entity.
 */
@SuppressWarnings("unused")
@Repository
public interface ImmagineMenuRepository extends JpaRepository<ImmagineMenu, UUID> {}
