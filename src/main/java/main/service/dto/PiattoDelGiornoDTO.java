package main.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * A DTO for the {@link main.domain.PiattoDelGiorno} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PiattoDelGiornoDTO implements Serializable {

    private UUID id;

    private LocalDate data;

    @NotNull
    private Boolean attivo;

    private String nome;

    private String descrizione;

    private BigDecimal prezzo;

    private ProdottoDTO prodotto;

    private MenuDTO menu;

    /**
     * Allergeni per i piatti personalizzati (senza prodotto collegato).
     * Per i piatti collegati a un prodotto, gli allergeni sono in prodotto.allergenis.
     */
    private List<AllergeneDTO> allergenis = new ArrayList<>();

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public LocalDate getData() {
        return data;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public Boolean getAttivo() {
        return attivo;
    }

    public void setAttivo(Boolean attivo) {
        this.attivo = attivo;
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

    public ProdottoDTO getProdotto() {
        return prodotto;
    }

    public void setProdotto(ProdottoDTO prodotto) {
        this.prodotto = prodotto;
    }

    public MenuDTO getMenu() {
        return menu;
    }

    public void setMenu(MenuDTO menu) {
        this.menu = menu;
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
        if (!(o instanceof PiattoDelGiornoDTO)) {
            return false;
        }
        PiattoDelGiornoDTO piattoDelGiornoDTO = (PiattoDelGiornoDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, piattoDelGiornoDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PiattoDelGiornoDTO{" +
            "id='" + getId() + "'" +
            ", data='" + getData() + "'" +
            ", attivo='" + getAttivo() + "'" +
            ", nome='" + getNome() + "'" +
            ", descrizione='" + getDescrizione() + "'" +
            ", prezzo=" + getPrezzo() +
            ", prodotto=" + getProdotto() +
            ", menu=" + getMenu() +
            ", allergenis=" + getAllergenis() +
            "}";
    }
}
