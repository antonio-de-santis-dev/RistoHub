package main.service.mapper;

import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import main.domain.Allergene;
import main.domain.Prodotto;
import main.service.dto.AllergeneDTO;
import main.service.dto.ProdottoDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Allergene} and its DTO {@link AllergeneDTO}.
 */
@Mapper(componentModel = "spring")
public interface AllergeneMapper extends EntityMapper<AllergeneDTO, Allergene> {
    // MODIFICA: Ignoriamo i prodotti quando convertiamo Allergene in DTO.
    // Questo previene il LazyInitializationException e velocizza le API.
    @Mapping(target = "prodottos", ignore = true)
    AllergeneDTO toDto(Allergene s);

    @Mapping(target = "prodottos", ignore = true)
    @Mapping(target = "removeProdotto", ignore = true)
    Allergene toEntity(AllergeneDTO allergeneDTO);

    @Named("prodottoId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    ProdottoDTO toDtoProdottoId(Prodotto prodotto);

    @Named("prodottoIdSet")
    default Set<ProdottoDTO> toDtoProdottoIdSet(Set<Prodotto> prodotto) {
        // MODIFICA: Aggiunto controllo per evitare NullPointerException
        if (prodotto == null) {
            return null;
        }
        return prodotto.stream().map(this::toDtoProdottoId).collect(Collectors.toSet());
    }

    default String map(UUID value) {
        return Objects.toString(value, null);
    }
}
