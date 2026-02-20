package main.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Allergene.
 */
@Entity
@Table(name = "allergene")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Allergene implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "nome", nullable = false)
    private String nome;

    @Lob
    @Column(name = "icona")
    private byte[] icona;

    @Column(name = "icona_content_type")
    private String iconaContentType;

    @Column(name = "colore")
    private String colore;

    @ManyToMany(fetch = FetchType.LAZY, mappedBy = "allergenis")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "allergenis", "portata" }, allowSetters = true)
    private Set<Prodotto> prodottos = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public Allergene id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getNome() {
        return this.nome;
    }

    public Allergene nome(String nome) {
        this.setNome(nome);
        return this;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public byte[] getIcona() {
        return icona;
    }

    public void setIcona(byte[] icona) {
        this.icona = icona;
    }

    public String getIconaContentType() {
        return iconaContentType;
    }

    public void setIconaContentType(String iconaContentType) {
        this.iconaContentType = iconaContentType;
    }

    public String getColore() {
        return colore;
    }

    public void setColore(String colore) {
        this.colore = colore;
    }

    public Set<Prodotto> getProdottos() {
        return this.prodottos;
    }

    public void setProdottos(Set<Prodotto> prodottos) {
        if (this.prodottos != null) {
            this.prodottos.forEach(i -> i.removeAllergeni(this));
        }
        if (prodottos != null) {
            prodottos.forEach(i -> i.addAllergeni(this));
        }
        this.prodottos = prodottos;
    }

    public Allergene prodottos(Set<Prodotto> prodottos) {
        this.setProdottos(prodottos);
        return this;
    }

    public Allergene addProdotto(Prodotto prodotto) {
        this.prodottos.add(prodotto);
        prodotto.getAllergenis().add(this);
        return this;
    }

    public Allergene removeProdotto(Prodotto prodotto) {
        this.prodottos.remove(prodotto);
        prodotto.getAllergenis().remove(this);
        return this;
    }

    public Allergene colore(String colore) {
        this.setColore(colore);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Allergene)) {
            return false;
        }
        return getId() != null && getId().equals(((Allergene) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore

    @Override
    public String toString() {
        return "Allergene{" +
            "id=" + id +
            ", nome='" + nome + '\'' +
            ", icona=" + Arrays.toString(icona) +
            ", iconaContentType='" + iconaContentType + '\'' +
            ", colore='" + colore + '\'' +
            ", prodottos=" + prodottos +
            '}';
    }
}
