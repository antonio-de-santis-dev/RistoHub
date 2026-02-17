package main.service.mapper;

import java.util.Objects;
import java.util.UUID;
import main.domain.PiattoDelGiorno;
import main.domain.Prodotto;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.dto.ProdottoDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link PiattoDelGiorno} and its DTO {@link PiattoDelGiornoDTO}.
 */
@Mapper(componentModel = "spring")
public interface PiattoDelGiornoMapper extends EntityMapper<PiattoDelGiornoDTO, PiattoDelGiorno> {
    @Mapping(target = "prodotto", source = "prodotto", qualifiedByName = "prodottoId")
    PiattoDelGiornoDTO toDto(PiattoDelGiorno s);

    @Named("prodottoId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    ProdottoDTO toDtoProdottoId(Prodotto prodotto);

    default String map(UUID value) {
        return Objects.toString(value, null);
    }
}
