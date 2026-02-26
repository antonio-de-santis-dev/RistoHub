package main.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * DTO per {@link main.domain.ContattoItem}.
 */
public class ContattoItemDTO implements Serializable {

    private UUID id;

    @NotNull
    private String tipo;

    @NotNull
    private String valore;

    /** Valorizzato solo quando tipo=SOCIAL */
    private String reteSociale;

    /** Etichetta personalizzata (richiesta per reteSociale=ALTRO) */
    private String etichetta;

    private Integer ordine;

    /** ID della lista padre (evita riferimenti circolari) */
    private UUID listaContattiId;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getValore() {
        return valore;
    }

    public void setValore(String valore) {
        this.valore = valore;
    }

    public String getReteSociale() {
        return reteSociale;
    }

    public void setReteSociale(String reteSociale) {
        this.reteSociale = reteSociale;
    }

    public String getEtichetta() {
        return etichetta;
    }

    public void setEtichetta(String etichetta) {
        this.etichetta = etichetta;
    }

    public Integer getOrdine() {
        return ordine;
    }

    public void setOrdine(Integer ordine) {
        this.ordine = ordine;
    }

    public UUID getListaContattiId() {
        return listaContattiId;
    }

    public void setListaContattiId(UUID listaContattiId) {
        this.listaContattiId = listaContattiId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ContattoItemDTO)) return false;
        ContattoItemDTO dto = (ContattoItemDTO) o;
        return id != null && id.equals(dto.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "ContattoItemDTO{id=" + id + ", tipo='" + tipo + "', valore='" + valore + "'}";
    }
}
