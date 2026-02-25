package main.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A PiattoDelGiorno.
 */
@Entity
@Table(name = "piatto_del_giorno")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PiattoDelGiorno implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "data", nullable = false)
    private LocalDate data;

    @NotNull
    @Column(name = "attivo", nullable = false)
    private Boolean attivo;

    @Column(name = "nome")
    private String nome;

    @Column(name = "descrizione")
    private String descrizione;

    @Column(name = "prezzo", precision = 21, scale = 2)
    private BigDecimal prezzo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "allergenis", "portata" }, allowSetters = true)
    private Prodotto prodotto;

    @ManyToOne
    @JoinColumn(name = "menu_id")
    private Menu menu;

    /**
     * Allergeni diretti per piatti personalizzati (senza prodotto collegato).
     *
     * FIX: inverseJoinColumns usa "allegene_id" (senza 'n') per corrispondere
     * alla colonna reale nella tabella piatto_del_giorno_allergenis creata
     * dalla migration 20240101_add_piatto_del_giorno_allergenis.xml
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JoinTable(
        name = "piatto_del_giorno_allergenis",
        joinColumns = @JoinColumn(name = "piatto_del_giorno_id"),
        inverseJoinColumns = @JoinColumn(name = "allegene_id")
    )
    @JsonIgnoreProperties(value = { "prodottos" }, allowSetters = true)
    private Set<Allergene> allergenis = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public UUID getId() {
        return this.id;
    }

    public PiattoDelGiorno id(UUID id) {
        this.setId(id);
        return this;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public LocalDate getData() {
        return this.data;
    }

    public PiattoDelGiorno data(LocalDate data) {
        this.setData(data);
        return this;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public Boolean getAttivo() {
        return this.attivo;
    }

    public PiattoDelGiorno attivo(Boolean attivo) {
        this.setAttivo(attivo);
        return this;
    }

    public void setAttivo(Boolean attivo) {
        this.attivo = attivo;
    }

    public String getNome() {
        return this.nome;
    }

    public PiattoDelGiorno nome(String nome) {
        this.setNome(nome);
        return this;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDescrizione() {
        return this.descrizione;
    }

    public PiattoDelGiorno descrizione(String descrizione) {
        this.setDescrizione(descrizione);
        return this;
    }

    public void setDescrizione(String descrizione) {
        this.descrizione = descrizione;
    }

    public BigDecimal getPrezzo() {
        return this.prezzo;
    }

    public PiattoDelGiorno prezzo(BigDecimal prezzo) {
        this.setPrezzo(prezzo);
        return this;
    }

    public void setPrezzo(BigDecimal prezzo) {
        this.prezzo = prezzo;
    }

    public Prodotto getProdotto() {
        return this.prodotto;
    }

    public void setProdotto(Prodotto prodotto) {
        this.prodotto = prodotto;
    }

    public PiattoDelGiorno prodotto(Prodotto prodotto) {
        this.setProdotto(prodotto);
        return this;
    }

    public Menu getMenu() {
        return menu;
    }

    public void setMenu(Menu menu) {
        this.menu = menu;
    }

    public PiattoDelGiorno menu(Menu menu) {
        this.setMenu(menu);
        return this;
    }

    public Set<Allergene> getAllergenis() {
        return this.allergenis;
    }

    public void setAllergenis(Set<Allergene> allergenis) {
        this.allergenis = allergenis;
    }

    public PiattoDelGiorno allergenis(Set<Allergene> allergenis) {
        this.setAllergenis(allergenis);
        return this;
    }

    public PiattoDelGiorno addAllergeni(Allergene allergene) {
        this.allergenis.add(allergene);
        return this;
    }

    public PiattoDelGiorno removeAllergeni(Allergene allergene) {
        this.allergenis.remove(allergene);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PiattoDelGiorno)) {
            return false;
        }
        return getId() != null && getId().equals(((PiattoDelGiorno) o).getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PiattoDelGiorno{" +
            "id=" + getId() +
            ", data='" + getData() + "'" +
            ", attivo='" + getAttivo() + "'" +
            ", nome='" + getNome() + "'" +
            ", descrizione='" + getDescrizione() + "'" +
            ", prezzo=" + getPrezzo() +
            "}";
    }
}
