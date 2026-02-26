package main.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.UUID;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * Singolo campo di contatto all'interno di una {@link ListaContatti}.
 *
 * Tipi supportati:
 *   TELEFONO  – numero di telefono  → link tel:
 *   EMAIL     – indirizzo e-mail    → link mailto:
 *   SOCIAL    – rete sociale        → link esterno, campo reteSociale obbligatorio
 *   INDIRIZZO – indirizzo fisico    → testo statico
 *
 * Per tipo=SOCIAL, reteSociale può essere:
 *   FACEBOOK | INSTAGRAM | X | YOUTUBE | TIKTOK | TELEGRAM |
 *   MESSENGER | THREADS | SNAPCHAT | WHATSAPP | GOOGLE | TRIPADVISOR | ALTRO
 */
@Entity
@Table(name = "contatto_item")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class ContattoItem implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "tipo", nullable = false)
    private String tipo;

    @NotNull
    @Column(name = "valore", nullable = false, length = 1000)
    private String valore;

    @Column(name = "rete_sociale")
    private String reteSociale;

    /** Etichetta personalizzata (obbligatoria per reteSociale=ALTRO) */
    @Column(name = "etichetta")
    private String etichetta;

    @Column(name = "ordine")
    private Integer ordine = 0;

    @ManyToOne(optional = false)
    @NotNull
    @JsonIgnoreProperties(value = { "items" }, allowSetters = true)
    private ListaContatti listaContatti;

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

    public ListaContatti getListaContatti() {
        return listaContatti;
    }

    public void setListaContatti(ListaContatti listaContatti) {
        this.listaContatti = listaContatti;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ContattoItem)) return false;
        return getId() != null && getId().equals(((ContattoItem) o).getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "ContattoItem{id=" + getId() + ", tipo='" + getTipo() + "', valore='" + getValore() + "'}";
    }
}
