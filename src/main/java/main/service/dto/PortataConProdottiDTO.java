package main.service.dto;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;
import main.domain.enumeration.NomePortataDefault;
import main.domain.enumeration.TipoPortata;

public record PortataConProdottiDTO(
    UUID id,
    TipoPortata tipo,
    NomePortataDefault nomeDefault,
    String nomePersonalizzato,
    List<ProdottoDTO> prodotti
)
    implements Serializable {}
