package main.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Menu.
 */
@Entity
@Table(name = "menu")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Menu implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "descrizione")
    private String descrizione;

    @NotNull
    @Column(name = "attivo", nullable = false)
    private Boolean attivo;

    @Column(name = "template_style")
    private String templateStyle;

    @Column(name = "colore_primario")
    private String colorePrimario;

    @Column(name = "colore_secondario")
    private String coloreSecondario;

    @Column(name = "font_menu")
    private String fontMenu;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "menu")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "prodottis", "menu" }, allowSetters = true)
    private Set<Portata> portates = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "menu")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "menu" }, allowSetters = true)
    private Set<ImmagineMenu> immaginis = new HashSet<>();

    @ManyToOne(optional = false)
    @NotNull
    private User ristoratore;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Menu id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getNome() {
        return this.nome;
    }

    public Menu nome(String nome) {
        this.setNome(nome);
        return this;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescrizione() {
        return this.descrizione;
    }

    public Menu descrizione(String descrizione) {
        this.setDescrizione(descrizione);
        return this;
    }

    public void setDescrizione(String descrizione) {
        this.descrizione = descrizione;
    }

    public Boolean getAttivo() {
        return this.attivo;
    }

    public Menu attivo(Boolean attivo) {
        this.setAttivo(attivo);
        return this;
    }

    public void setAttivo(Boolean attivo) {
        this.attivo = attivo;
    }

    public String getTemplateStyle() {
        return this.templateStyle;
    }

    public Menu templateStyle(String templateStyle) {
        this.setTemplateStyle(templateStyle);
        return this;
    }

    public void setTemplateStyle(String templateStyle) {
        this.templateStyle = templateStyle;
    }

    public String getColorePrimario() {
        return this.colorePrimario;
    }

    public Menu colorePrimario(String colorePrimario) {
        this.setColorePrimario(colorePrimario);
        return this;
    }

    public void setColorePrimario(String colorePrimario) {
        this.colorePrimario = colorePrimario;
    }

    public String getColoreSecondario() {
        return this.coloreSecondario;
    }

    public Menu coloreSecondario(String coloreSecondario) {
        this.setColoreSecondario(coloreSecondario);
        return this;
    }

    public void setColoreSecondario(String coloreSecondario) {
        this.coloreSecondario = coloreSecondario;
    }

    public String getFontMenu() {
        return this.fontMenu;
    }

    public Menu fontMenu(String fontMenu) {
        this.setFontMenu(fontMenu);
        return this;
    }

    public void setFontMenu(String fontMenu) {
        this.fontMenu = fontMenu;
    }

    public Set<Portata> getPortates() {
        return this.portates;
    }

    public void setPortates(Set<Portata> portatas) {
        if (this.portates != null) {
            this.portates.forEach(i -> i.setMenu(null));
        }
        if (portatas != null) {
            portatas.forEach(i -> i.setMenu(this));
        }
        this.portates = portatas;
    }

    public Menu portates(Set<Portata> portatas) {
        this.setPortates(portatas);
        return this;
    }

    public Menu addPortate(Portata portata) {
        this.portates.add(portata);
        portata.setMenu(this);
        return this;
    }

    public Menu removePortate(Portata portata) {
        this.portates.remove(portata);
        portata.setMenu(null);
        return this;
    }

    public Set<ImmagineMenu> getImmaginis() {
        return this.immaginis;
    }

    public void setImmaginis(Set<ImmagineMenu> immagineMenus) {
        if (this.immaginis != null) {
            this.immaginis.forEach(i -> i.setMenu(null));
        }
        if (immagineMenus != null) {
            immagineMenus.forEach(i -> i.setMenu(this));
        }
        this.immaginis = immagineMenus;
    }

    public Menu immaginis(Set<ImmagineMenu> immagineMenus) {
        this.setImmaginis(immagineMenus);
        return this;
    }

    public Menu addImmagini(ImmagineMenu immagineMenu) {
        this.immaginis.add(immagineMenu);
        immagineMenu.setMenu(this);
        return this;
    }

    public Menu removeImmagini(ImmagineMenu immagineMenu) {
        this.immaginis.remove(immagineMenu);
        immagineMenu.setMenu(null);
        return this;
    }

    public User getRistoratore() {
        return this.ristoratore;
    }

    public void setRistoratore(User user) {
        this.ristoratore = user;
    }

    public Menu ristoratore(User user) {
        this.setRistoratore(user);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Menu)) {
            return false;
        }
        return getId() != null && getId().equals(((Menu) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Menu{" +
            "id=" + getId() +
            ", nome='" + getNome() + "'" +
            ", descrizione='" + getDescrizione() + "'" +
            ", attivo='" + getAttivo() + "'" +
            ", templateStyle='" + getTemplateStyle() + "'" +
            ", colorePrimario='" + getColorePrimario() + "'" +
            ", coloreSecondario='" + getColoreSecondario() + "'" +
            ", fontMenu='" + getFontMenu() + "'" +
            "}";
    }
}
