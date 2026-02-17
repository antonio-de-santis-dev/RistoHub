package main.service.mapper;

import java.util.Objects;
import java.util.UUID;
import main.domain.Menu;
import main.domain.Portata;
import main.service.dto.MenuDTO;
import main.service.dto.PortataDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Portata} and its DTO {@link PortataDTO}.
 */
@Mapper(componentModel = "spring")
public interface PortataMapper extends EntityMapper<PortataDTO, Portata> {
    @Mapping(target = "menu", source = "menu", qualifiedByName = "menuId")
    PortataDTO toDto(Portata s);

    @Named("menuId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    MenuDTO toDtoMenuId(Menu menu);

    default String map(UUID value) {
        return Objects.toString(value, null);
    }
}
