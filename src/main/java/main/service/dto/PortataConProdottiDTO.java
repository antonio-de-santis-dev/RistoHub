package main.service.dto;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;
import main.domain.enumeration.NomePortataDefault;
import main.domain.enumeration.TipoPortata;

/**
 * DTO aggregato per la vista pubblica del menu.
 * Include il campo "traduzioni" che contiene il JSON delle traduzioni
 * di {@code nomePersonalizzato} in EN/FR/DE/ES (solo per portate PERSONALIZZATA).
 */
public record PortataConProdottiDTO(
    UUID id,
    TipoPortata tipo,
    NomePortataDefault nomeDefault,
    String nomePersonalizzato,
    String traduzioni,
    List<ProdottoDTO> prodotti
)
    implements Serializable {}
