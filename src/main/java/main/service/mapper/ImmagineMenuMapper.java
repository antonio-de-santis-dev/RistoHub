package main.service.mapper;

import java.util.Objects;
import java.util.UUID;
import main.domain.ImmagineMenu;
import main.domain.Menu;
import main.service.dto.ImmagineMenuDTO;
import main.service.dto.MenuDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link ImmagineMenu} and its DTO {@link ImmagineMenuDTO}.
 */
@Mapper(componentModel = "spring")
public interface ImmagineMenuMapper extends EntityMapper<ImmagineMenuDTO, ImmagineMenu> {
    @Mapping(target = "menu", source = "menu", qualifiedByName = "menuId")
    ImmagineMenuDTO toDto(ImmagineMenu s);

    @Named("menuId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    MenuDTO toDtoMenuId(Menu menu);

    default String map(UUID value) {
        return Objects.toString(value, null);
    }
}
