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

    @Mapping(target = "menu", source = "menu", qualifiedByName = "menuFromDto")
    @Mapping(target = "prodottis", ignore = true)
    @Mapping(target = "removeProdotti", ignore = true)
    Portata toEntity(PortataDTO portataDTO);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "menu", source = "menu", qualifiedByName = "menuFromDto")
    @Mapping(target = "prodottis", ignore = true)
    @Mapping(target = "removeProdotti", ignore = true)
    void partialUpdate(@MappingTarget Portata entity, PortataDTO dto);

    @Named("menuId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    MenuDTO toDtoMenuId(Menu menu);

    @Named("menuFromDto")
    default Menu menuFromDto(MenuDTO menuDTO) {
        if (menuDTO == null || menuDTO.getId() == null) return null;
        Menu menu = new Menu();
        menu.setId(menuDTO.getId());
        return menu;
    }

    default String map(UUID value) {
        return Objects.toString(value, null);
    }
}
