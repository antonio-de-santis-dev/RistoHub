package main.service.mapper;

import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.Allergene;
import main.domain.Portata;
import main.domain.Prodotto;
import main.service.dto.AllergeneDTO;
import main.service.dto.PortataDTO;
import main.service.dto.ProdottoDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Prodotto} and its DTO {@link ProdottoDTO}.
 */
@Mapper(componentModel = "spring")
public interface ProdottoMapper extends EntityMapper<ProdottoDTO, Prodotto> {
    @Mapping(target = "allergenis", source = "allergenis", qualifiedByName = "allergeneIdSet")
    @Mapping(target = "portata", source = "portata", qualifiedByName = "portataId")
    ProdottoDTO toDto(Prodotto s);

    @Mapping(target = "removeAllergeni", ignore = true)
    Prodotto toEntity(ProdottoDTO prodottoDTO);

    @Named("allergeneId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    AllergeneDTO toDtoAllergeneId(Allergene allergene);

    @Named("allergeneIdSet")
    default Set<AllergeneDTO> toDtoAllergeneIdSet(Set<Allergene> allergene) {
        return allergene.stream().map(this::toDtoAllergeneId).collect(Collectors.toSet());
    }

    @Named("portataId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    PortataDTO toDtoPortataId(Portata portata);

    default String map(UUID value) {
        return Objects.toString(value, null);
    }
}
