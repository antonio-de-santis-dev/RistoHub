package main.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.UUID;
import main.domain.enumeration.TipoImmagine;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A ImmagineMenu.
 */
@Entity
@Table(name = "immagine_menu")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ImmagineMenu implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column(name = "nome")
    private String nome;

    @Lob
    @Column(name = "immagine", nullable = false)
    private byte[] immagine;

    @NotNull
    @Column(name = "immagine_content_type", nullable = false)
    private String immagineContentType;

    @Column(name = "content_type")
    private String contentType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoImmagine tipo;

    // ── NUOVI CAMPI per gestione carosello ────────────────
    @Column(name = "ordine", nullable = false)
    private Integer ordine = 0;

    @Column(name = "visibile", nullable = false)
    private Boolean visibile = true;

    // ─────────────────────────────────────────────────────

    @ManyToOne(optional = false)
    @NotNull
    @JsonIgnoreProperties(value = { "portates", "immaginis", "ristoratore" }, allowSetters = true)
    private Menu menu;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public ImmagineMenu id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getNome() {
        return this.nome;
    }

    public ImmagineMenu nome(String nome) {
        this.setNome(nome);
        return this;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public byte[] getImmagine() {
        return this.immagine;
    }

    public ImmagineMenu immagine(byte[] immagine) {
        this.setImmagine(immagine);
        return this;
    }

    public void setImmagine(byte[] immagine) {
        this.immagine = immagine;
    }

    public String getImmagineContentType() {
        return this.immagineContentType;
    }

    public ImmagineMenu immagineContentType(String immagineContentType) {
        this.immagineContentType = immagineContentType;
        return this;
    }

    public void setImmagineContentType(String immagineContentType) {
        this.immagineContentType = immagineContentType;
    }

    public String getContentType() {
        return this.contentType;
    }

    public ImmagineMenu contentType(String contentType) {
        this.setContentType(contentType);
        return this;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public TipoImmagine getTipo() {
        return this.tipo;
    }

    public ImmagineMenu tipo(TipoImmagine tipo) {
        this.setTipo(tipo);
        return this;
    }

    public void setTipo(TipoImmagine tipo) {
        this.tipo = tipo;
    }

    public Integer getOrdine() {
        return this.ordine;
    }

    public ImmagineMenu ordine(Integer ordine) {
        this.setOrdine(ordine);
        return this;
    }

    public void setOrdine(Integer ordine) {
        this.ordine = ordine;
    }

    public Boolean getVisibile() {
        return this.visibile;
    }

    public ImmagineMenu visibile(Boolean visibile) {
        this.setVisibile(visibile);
        return this;
    }

    public void setVisibile(Boolean visibile) {
        this.visibile = visibile;
    }

    public Menu getMenu() {
        return this.menu;
    }

    public void setMenu(Menu menu) {
        this.menu = menu;
    }

    public ImmagineMenu menu(Menu menu) {
        this.setMenu(menu);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ImmagineMenu)) {
            return false;
        }
        return getId() != null && getId().equals(((ImmagineMenu) o).getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ImmagineMenu{" +
            "id=" + getId() +
            ", nome='" + getNome() + "'" +
            ", immagine='" + getImmagine() + "'" +
            ", immagineContentType='" + getImmagineContentType() + "'" +
            ", contentType='" + getContentType() + "'" +
            ", tipo='" + getTipo() + "'" +
            ", ordine=" + getOrdine() +
            ", visibile=" + getVisibile() +
            "}";
    }
}
