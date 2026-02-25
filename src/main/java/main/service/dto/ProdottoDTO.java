package main.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
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
     * Riferimento alla portata di appartenenza.
     * Necessario per il salvataggio (Prodotto.portata è @NotNull nel DB).
     * Il mapper usa solo l'id per stabilire la relazione ManyToOne.
     */
    private PortataDTO portata;

    /**
     * Allergeni del prodotto — popolati nella risposta per visualizzare le icone.
     */
    private List<AllergeneDTO> allergenis = new ArrayList<>();

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

    public List<AllergeneDTO> getAllergenis() {
        return allergenis;
    }

    public void setAllergenis(List<AllergeneDTO> allergenis) {
        this.allergenis = allergenis;
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
