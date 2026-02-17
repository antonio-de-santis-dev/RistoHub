package main.service.mapper;

import main.domain.Menu;
import main.domain.User;
import main.service.dto.MenuDTO;
import main.service.dto.UserDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Menu} and its DTO {@link MenuDTO}.
 */
@Mapper(componentModel = "spring")
public interface MenuMapper extends EntityMapper<MenuDTO, Menu> {
    @Mapping(target = "ristoratore", source = "ristoratore", qualifiedByName = "userLogin")
    MenuDTO toDto(Menu s);

    @Named("userLogin")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "login", source = "login")
    UserDTO toDtoUserLogin(User user);
}
