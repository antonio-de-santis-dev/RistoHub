package main.service.mapper;

import java.util.ArrayList;
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
    ProdottoDTO toDto(Prodotto s);

    @Mapping(target = "removeAllergeni", ignore = true)
    @Mapping(target = "portata", source = "portata", qualifiedByName = "portataFromDto")
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
     * Implementato come default per evitare che MapStruct generi
     * un'implementazione astratta non risolvibile.
     * JPA ha bisogno solo dell'id per stabilire la relazione ManyToOne.
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
     * Mappa un singolo Allergene con tutti i campi per visualizzare le icone:
     * id, nome, icona (byte[] → base64), iconaContentType, colore.
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
     * Converte Set<Allergene> → List<AllergeneDTO> con tutti i campi.
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

    default String map(UUID value) {
        return Objects.toString(value, null);
    }
}
