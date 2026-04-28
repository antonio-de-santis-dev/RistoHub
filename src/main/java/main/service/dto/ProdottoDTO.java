package main.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * A DTO for the {@link main.domain.Prodotto} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ProdottoDTO implements Serializable {

    private UUID id;

    @NotNull
    private String nome;

    private String descrizione;

    @NotNull
    private BigDecimal prezzo;

    /**
     * FIX Bug 3: cambiato da boolean primitivo a Boolean wrapper.
     */
    private Boolean visibile = true;

    /**
     * Riferimento alla portata di appartenenza.
     */
    private PortataDTO portata;

    /**
     * Allergeni del prodotto.
     */
    private List<AllergeneDTO> allergenis = new ArrayList<>();

    /**
     * Traduzioni pre-calcolate del prodotto.
     *
     * STRUTTURA:
     *   { "en": { "nome": "...", "descrizione": "..." },
     *     "fr": { "nome": "...", "descrizione": "..." }, ... }
     *
     * Usato dal frontend per evitare chiamate a LibreTranslate al primo caricamento.
     * Null o mappa vuota = nessuna traduzione disponibile nel DB (verrà generata on-demand).
     */
    private Map<String, Map<String, String>> traduzioni = new HashMap<>();

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescrizione() {
        return descrizione;
    }

    public void setDescrizione(String descrizione) {
        this.descrizione = descrizione;
    }

    public BigDecimal getPrezzo() {
        return prezzo;
    }

    public void setPrezzo(BigDecimal prezzo) {
        this.prezzo = prezzo;
    }

    public PortataDTO getPortata() {
        return portata;
    }

    public void setPortata(PortataDTO portata) {
        this.portata = portata;
    }

    public Boolean isVisibile() {
        return visibile;
    }

    public void setVisibile(Boolean visibile) {
        this.visibile = visibile;
    }

    public List<AllergeneDTO> getAllergenis() {
        return allergenis;
    }

    public void setAllergenis(List<AllergeneDTO> allergenis) {
        this.allergenis = allergenis;
    }

    public Map<String, Map<String, String>> getTraduzioni() {
        return traduzioni;
    }

    public void setTraduzioni(Map<String, Map<String, String>> traduzioni) {
        this.traduzioni = traduzioni;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ProdottoDTO)) {
            return false;
        }
        ProdottoDTO prodottoDTO = (ProdottoDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, prodottoDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ProdottoDTO{" +
            "id='" + getId() + "'" +
            ", nome='" + getNome() + "'" +
            ", descrizione='" + getDescrizione() + "'" +
            ", prezzo=" + getPrezzo() +
            ", portata=" + getPortata() +
            ", allergenis=" + getAllergenis() +
            "}";
    }
}
