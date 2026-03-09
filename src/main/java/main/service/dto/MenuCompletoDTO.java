package main.service.dto;

import java.io.Serializable;
import java.util.List;

public record MenuCompletoDTO(
    MenuDTO menu,
    List<PortataConProdottiDTO> portate,
    List<PiattoDelGiornoDTO> piattiDelGiorno,
    List<ImmagineMenuDTO> immagini,
    List<AllergeneDTO> allergeni,
    List<ListaContattiDTO> contatti
)
    implements Serializable {}
