package main.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Prodotto.
 */
@Entity
@Table(name = "prodotto")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Prodotto implements Serializable {

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
    @Column(name = "prezzo", precision = 21, scale = 2, nullable = false)
    private BigDecimal prezzo;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "rel_prodotto__allergeni",
        joinColumns = @JoinColumn(name = "prodotto_id"),
        inverseJoinColumns = @JoinColumn(name = "allergeni_id")
    )
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "prodottos" }, allowSetters = true)
    private Set<Allergene> allergenis = new HashSet<>();

    @ManyToOne(optional = false)
    @NotNull
    @JsonIgnoreProperties(value = { "prodottis", "menu" }, allowSetters = true)
    private Portata portata;

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Prodotto id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getNome() {
        return this.nome;
    }

    public Prodotto nome(String nome) {
        this.setNome(nome);
        return this;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescrizione() {
        return this.descrizione;
    }

    public Prodotto descrizione(String descrizione) {
        this.setDescrizione(descrizione);
        return this;
    }

    public void setDescrizione(String descrizione) {
        this.descrizione = descrizione;
    }

    public BigDecimal getPrezzo() {
        return this.prezzo;
    }

    public Prodotto prezzo(BigDecimal prezzo) {
        this.setPrezzo(prezzo);
        return this;
    }

    public void setPrezzo(BigDecimal prezzo) {
        this.prezzo = prezzo;
    }

    public Set<Allergene> getAllergenis() {
        return this.allergenis;
    }

    public void setAllergenis(Set<Allergene> allergenes) {
        this.allergenis = allergenes;
    }

    public Prodotto allergenis(Set<Allergene> allergenes) {
        this.setAllergenis(allergenes);
        return this;
    }

    public Prodotto addAllergeni(Allergene allergene) {
        this.allergenis.add(allergene);
        return this;
    }

    public Prodotto removeAllergeni(Allergene allergene) {
        this.allergenis.remove(allergene);
        return this;
    }

    public Portata getPortata() {
        return this.portata;
    }

    public void setPortata(Portata portata) {
        this.portata = portata;
    }

    public Prodotto portata(Portata portata) {
        this.setPortata(portata);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Prodotto)) {
            return false;
        }
        return getId() != null && getId().equals(((Prodotto) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Prodotto{" +
            "id=" + getId() +
            ", nome='" + getNome() + "'" +
            ", descrizione='" + getDescrizione() + "'" +
            ", prezzo=" + getPrezzo() +
            "}";
    }
}
