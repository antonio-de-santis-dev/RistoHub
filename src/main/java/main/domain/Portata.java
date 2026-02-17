package main.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import main.domain.enumeration.NomePortataDefault;
import main.domain.enumeration.TipoPortata;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Portata.
 */
@Entity
@Table(name = "portata")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Portata implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoPortata tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "nome_default")
    private NomePortataDefault nomeDefault;

    @Column(name = "nome_personalizzato")
    private String nomePersonalizzato;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "portata")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "allergenis", "portata" }, allowSetters = true)
    private Set<Prodotto> prodottis = new HashSet<>();

    @ManyToOne(optional = false)
    @NotNull
    @JsonIgnoreProperties(value = { "portates", "immaginis", "ristoratore" }, allowSetters = true)
    private Menu menu;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Portata id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public TipoPortata getTipo() {
        return this.tipo;
    }

    public Portata tipo(TipoPortata tipo) {
        this.setTipo(tipo);
        return this;
    }

    public void setTipo(TipoPortata tipo) {
        this.tipo = tipo;
    }

    public NomePortataDefault getNomeDefault() {
        return this.nomeDefault;
    }

    public Portata nomeDefault(NomePortataDefault nomeDefault) {
        this.setNomeDefault(nomeDefault);
        return this;
    }

    public void setNomeDefault(NomePortataDefault nomeDefault) {
        this.nomeDefault = nomeDefault;
    }

    public String getNomePersonalizzato() {
        return this.nomePersonalizzato;
    }

    public Portata nomePersonalizzato(String nomePersonalizzato) {
        this.setNomePersonalizzato(nomePersonalizzato);
        return this;
    }

    public void setNomePersonalizzato(String nomePersonalizzato) {
        this.nomePersonalizzato = nomePersonalizzato;
    }

    public Set<Prodotto> getProdottis() {
        return this.prodottis;
    }

    public void setProdottis(Set<Prodotto> prodottos) {
        if (this.prodottis != null) {
            this.prodottis.forEach(i -> i.setPortata(null));
        }
        if (prodottos != null) {
            prodottos.forEach(i -> i.setPortata(this));
        }
        this.prodottis = prodottos;
    }

    public Portata prodottis(Set<Prodotto> prodottos) {
        this.setProdottis(prodottos);
        return this;
    }

    public Portata addProdotti(Prodotto prodotto) {
        this.prodottis.add(prodotto);
        prodotto.setPortata(this);
        return this;
    }

    public Portata removeProdotti(Prodotto prodotto) {
        this.prodottis.remove(prodotto);
        prodotto.setPortata(null);
        return this;
    }

    public Menu getMenu() {
        return this.menu;
    }

    public void setMenu(Menu menu) {
        this.menu = menu;
    }

    public Portata menu(Menu menu) {
        this.setMenu(menu);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Portata)) {
            return false;
        }
        return getId() != null && getId().equals(((Portata) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Portata{" +
            "id=" + getId() +
            ", tipo='" + getTipo() + "'" +
            ", nomeDefault='" + getNomeDefault() + "'" +
            ", nomePersonalizzato='" + getNomePersonalizzato() + "'" +
            "}";
    }
}
