package main.service.mapper;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
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
    @Mapping(target = "allergenis", source = "allergenis", qualifiedByName = "allergeniSetToList")
    @Mapping(target = "portata", source = "portata", qualifiedByName = "portataId")
    @Mapping(target = "traduzioni", source = "traduzioni")
    ProdottoDTO toDto(Prodotto s);

    @Mapping(target = "allergenis", source = "allergenis", qualifiedByName = "allergenDtoListToSet")
    @Mapping(target = "removeAllergeni", ignore = true)
    @Mapping(target = "portata", source = "portata", qualifiedByName = "portataFromDto")
    @Mapping(target = "traduzioni", source = "traduzioni")
    Prodotto toEntity(ProdottoDTO prodottoDTO);

    /**
     * toDto: mappa solo l'id della portata per evitare ricorsione infinita.
     */
    @Named("portataId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    PortataDTO toDtoPortataId(Portata portata);

    /**
     * toEntity: ricostruisce la Portata dall'id nel DTO.
     */
    @Named("portataFromDto")
    default Portata portataFromDto(PortataDTO portataDTO) {
        if (portataDTO == null || portataDTO.getId() == null) {
            return null;
        }
        Portata portata = new Portata();
        portata.setId(portataDTO.getId());
        return portata;
    }

    /**
     * Mappa un singolo Allergene con tutti i campi per visualizzare le icone.
     */
    @Named("allergeneConDettagli")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "nome", source = "nome")
    @Mapping(target = "icona", source = "icona")
    @Mapping(target = "iconaContentType", source = "iconaContentType")
    @Mapping(target = "colore", source = "colore")
    AllergeneDTO toDtoAllergeneConDettagli(Allergene allergene);

    /**
     * toDto: converte Set<Allergene> → List<AllergeneDTO> con tutti i campi.
     */
    @Named("allergeniSetToList")
    default List<AllergeneDTO> allergeniSetToList(Set<Allergene> allergenis) {
        if (allergenis == null) {
            return new ArrayList<>();
        }
        List<AllergeneDTO> result = new ArrayList<>();
        for (Allergene a : allergenis) {
            result.add(toDtoAllergeneConDettagli(a));
        }
        return result;
    }

    /**
     * toEntity: converte List<AllergeneDTO> → Set<Allergene> per la persistenza.
     */
    @Named("allergenDtoListToSet")
    default Set<Allergene> allergenDtoListToSet(List<AllergeneDTO> allergeniDtos) {
        if (allergeniDtos == null) {
            return new HashSet<>();
        }
        Set<Allergene> result = new HashSet<>();
        for (AllergeneDTO dto : allergeniDtos) {
            if (dto.getId() != null) {
                Allergene a = new Allergene();
                a.setId(dto.getId());
                result.add(a);
            }
        }
        return result;
    }

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "allergenis", source = "allergenis", qualifiedByName = "allergenDtoListToSet")
    @Mapping(target = "removeAllergeni", ignore = true)
    @Mapping(target = "portata", source = "portata", qualifiedByName = "portataFromDto")
    // NON mappiamo traduzioni nel partialUpdate: non vogliamo che un PATCH
    // (es. toggle visibile) sovrascriva le traduzioni già calcolate.
    @Mapping(target = "traduzioni", ignore = true)
    void partialUpdate(@MappingTarget Prodotto entity, ProdottoDTO dto);

    default String map(UUID value) {
        return Objects.toString(value, null);
    }
}
