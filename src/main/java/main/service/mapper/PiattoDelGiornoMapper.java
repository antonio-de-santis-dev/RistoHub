package main.service.mapper;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import main.domain.Allergene;
import main.domain.Menu;
import main.domain.PiattoDelGiorno;
import main.domain.Prodotto;
import main.service.dto.AllergeneDTO;
import main.service.dto.MenuDTO;
import main.service.dto.PiattoDelGiornoDTO;
import main.service.dto.ProdottoDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link PiattoDelGiorno} and its DTO {@link PiattoDelGiornoDTO}.
 *
 * Gestisce due casi:
 * 1. Piatto collegato a un prodotto → allergenis presi da prodotto.allergenis
 * 2. Piatto personalizzato (prodotto = null) → allergenis diretti del piatto
 */
@Mapper(componentModel = "spring")
public interface PiattoDelGiornoMapper extends EntityMapper<PiattoDelGiornoDTO, PiattoDelGiorno> {
    @Mapping(target = "prodotto", source = "prodotto", qualifiedByName = "prodottoConDettagliEAllergeni")
    @Mapping(target = "menu", source = "menu", qualifiedByName = "menuId")
    @Mapping(target = "allergenis", source = "allergenis", qualifiedByName = "allergeniSetToList")
    PiattoDelGiornoDTO toDto(PiattoDelGiorno s);

    @Mapping(target = "allergenis", source = "allergenis", qualifiedByName = "allergenDtoListToSet")
    @Mapping(target = "removeAllergeni", ignore = true)
    PiattoDelGiorno toEntity(PiattoDelGiornoDTO piattoDelGiornoDTO);

    /**
     * Mappa il prodotto includendo id, nome, descrizione, prezzo e allergenis.
     */
    @Named("prodottoConDettagliEAllergeni")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "nome", source = "nome")
    @Mapping(target = "descrizione", source = "descrizione")
    @Mapping(target = "prezzo", source = "prezzo")
    @Mapping(target = "allergenis", source = "allergenis", qualifiedByName = "allergeniSetToList")
    ProdottoDTO toDtoProdottoConDettagliEAllergeni(Prodotto prodotto);

    /**
     * Mappa solo l'id del menu (per evitare ricorsione).
     */
    @Named("menuId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    MenuDTO toDtoMenuId(Menu menu);

    /**
     * Converte Set<Allergene> → List<AllergeneDTO> con tutti i campi inclusi:
     * id, nome, icona (byte[] → base64 automatico da Jackson), iconaContentType, colore.
     */
    @Named("allergeniSetToList")
    default List<AllergeneDTO> allergeniSetToList(Set<Allergene> allergenis) {
        if (allergenis == null) {
            return new ArrayList<>();
        }
        List<AllergeneDTO> result = new ArrayList<>();
        for (Allergene a : allergenis) {
            AllergeneDTO dto = new AllergeneDTO();
            dto.setId(a.getId());
            dto.setNome(a.getNome());
            dto.setIcona(a.getIcona());
            dto.setIconaContentType(a.getIconaContentType());
            dto.setColore(a.getColore());
            result.add(dto);
        }
        return result;
    }

    /**
     * Converte List<AllergeneDTO> → Set<Allergene> per il salvataggio.
     * JPA ha bisogno solo dell'id per stabilire la relazione ManyToMany.
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

    default String map(UUID value) {
        return Objects.toString(value, null);
    }
}
