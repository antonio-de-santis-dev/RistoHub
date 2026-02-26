package main.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.*;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * Lista Contatti – collezione di recapiti da mostrare su uno o più menu.
 * Creata e gestita da qualsiasi utente registrato (ROLE_USER o ROLE_ADMIN).
 */
@Entity
@Table(name = "lista_contatti")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class ListaContatti implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "nome", nullable = false)
    private String nome;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "lista_contatti_menu", joinColumns = @JoinColumn(name = "lista_contatti_id"))
    @Column(name = "menu_id")
    private Set<UUID> menuIds = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "listaContatti", cascade = CascadeType.ALL, orphanRemoval = true)
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "listaContatti" }, allowSetters = true)
    private List<ContattoItem> items = new ArrayList<>();

    /**
     * Utente proprietario della lista.
     * Qualsiasi utente registrato (ROLE_USER o ROLE_ADMIN) può creare liste.
     */
    @ManyToOne(optional = false)
    @NotNull
    private User ristoratore;

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

    public Set<UUID> getMenuIds() {
        return menuIds;
    }

    public void setMenuIds(Set<UUID> menuIds) {
        this.menuIds = menuIds;
    }

    public List<ContattoItem> getItems() {
        return items;
    }

    public void setItems(List<ContattoItem> items) {
        if (this.items != null) this.items.forEach(i -> i.setListaContatti(null));
        if (items != null) items.forEach(i -> i.setListaContatti(this));
        this.items = items;
    }

    public void addItem(ContattoItem item) {
        this.items.add(item);
        item.setListaContatti(this);
    }

    public void removeItem(ContattoItem item) {
        this.items.remove(item);
        item.setListaContatti(null);
    }

    public User getRistoratore() {
        return ristoratore;
    }

    public void setRistoratore(User ristoratore) {
        this.ristoratore = ristoratore;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ListaContatti)) return false;
        return getId() != null && getId().equals(((ListaContatti) o).getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "ListaContatti{id=" + getId() + ", nome='" + getNome() + "'}";
    }
}
