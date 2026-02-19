package main.service.mapper;

import java.util.Objects;
import java.util.UUID;
import main.domain.Menu;
import main.domain.PiattoDelGiorno;
import main.domain.Prodotto;
import main.service.dto.MenuDTO;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.dto.ProdottoDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link PiattoDelGiorno} and its DTO {@link PiattoDelGiornoDTO}.
 */
@Mapper(componentModel = "spring")
public interface PiattoDelGiornoMapper extends EntityMapper<PiattoDelGiornoDTO, PiattoDelGiorno> {
    @Mapping(target = "prodotto", source = "prodotto", qualifiedByName = "prodottoConDettagli")
    @Mapping(target = "menu", source = "menu", qualifiedByName = "menuId")
    PiattoDelGiornoDTO toDto(PiattoDelGiorno s);

    // ← PRIMA: copiava solo l'id, ignorando nome e prezzo
    // ← ORA: copia id, nome, descrizione e prezzo del prodotto
    @Named("prodottoConDettagli")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "nome", source = "nome")
    @Mapping(target = "descrizione", source = "descrizione")
    @Mapping(target = "prezzo", source = "prezzo")
    ProdottoDTO toDtoProdottoConDettagli(Prodotto prodotto);

    // Mapping menu: solo l'id è sufficiente per il frontend
    @Named("menuId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    MenuDTO toDtoMenuId(Menu menu);

    default String map(UUID value) {
        return Objects.toString(value, null);
    }
}
