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
    @Mapping(target = "ordine", source = "ordine")
    @Mapping(target = "visibile", source = "visibile")
    ImmagineMenuDTO toDto(ImmagineMenu s);

    @Mapping(target = "ordine", source = "ordine")
    @Mapping(target = "visibile", source = "visibile")
    ImmagineMenu toEntity(ImmagineMenuDTO dto);

    @Named("menuId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    MenuDTO toDtoMenuId(Menu menu);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "ordine", source = "ordine")
    @Mapping(target = "visibile", source = "visibile")
    void partialUpdate(@MappingTarget ImmagineMenu entity, ImmagineMenuDTO dto);

    default String map(UUID value) {
        return Objects.toString(value, null);
    }
}
