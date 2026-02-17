package main.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
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

    private Set<AllergeneDTO> allergenis = new HashSet<>();

    @NotNull
    private PortataDTO portata;

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

    public Set<AllergeneDTO> getAllergenis() {
        return allergenis;
    }

    public void setAllergenis(Set<AllergeneDTO> allergenis) {
        this.allergenis = allergenis;
    }

    public PortataDTO getPortata() {
        return portata;
    }

    public void setPortata(PortataDTO portata) {
        this.portata = portata;
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
            ", allergenis=" + getAllergenis() +
            ", portata=" + getPortata() +
            "}";
    }
}
