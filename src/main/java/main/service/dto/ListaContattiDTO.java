package main.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.*;

/**
 * DTO per {@link main.domain.ListaContatti}.
 */
public class ListaContattiDTO implements Serializable {

    private UUID id;

    @NotNull
    private String nome;

    /** UUID dei menu su cui questa lista è visibile */
    private Set<UUID> menuIds = new HashSet<>();

    /** Campi di contatto ordinati */
    private List<ContattoItemDTO> items = new ArrayList<>();

    /** Ristoratore proprietario (solo login e id, mai password) */
    private UserDTO ristoratore;

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

    public List<ContattoItemDTO> getItems() {
        return items;
    }

    public void setItems(List<ContattoItemDTO> items) {
        this.items = items;
    }

    public UserDTO getRistoratore() {
        return ristoratore;
    }

    public void setRistoratore(UserDTO ristoratore) {
        this.ristoratore = ristoratore;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ListaContattiDTO)) return false;
        ListaContattiDTO dto = (ListaContattiDTO) o;
        return id != null && id.equals(dto.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "ListaContattiDTO{id=" + id + ", nome='" + nome + "', menuIds=" + menuIds + "}";
    }
}
