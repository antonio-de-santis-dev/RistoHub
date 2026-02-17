package main.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;
import main.domain.enumeration.NomePortataDefault;
import main.domain.enumeration.TipoPortata;

/**
 * A DTO for the {@link main.domain.Portata} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class PortataDTO implements Serializable {

    private UUID id;

    @NotNull
    private TipoPortata tipo;

    private NomePortataDefault nomeDefault;

    private String nomePersonalizzato;

    @NotNull
    private MenuDTO menu;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public TipoPortata getTipo() {
        return tipo;
    }

    public void setTipo(TipoPortata tipo) {
        this.tipo = tipo;
    }

    public NomePortataDefault getNomeDefault() {
        return nomeDefault;
    }

    public void setNomeDefault(NomePortataDefault nomeDefault) {
        this.nomeDefault = nomeDefault;
    }

    public String getNomePersonalizzato() {
        return nomePersonalizzato;
    }

    public void setNomePersonalizzato(String nomePersonalizzato) {
        this.nomePersonalizzato = nomePersonalizzato;
    }

    public MenuDTO getMenu() {
        return menu;
    }

    public void setMenu(MenuDTO menu) {
        this.menu = menu;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof PortataDTO)) {
            return false;
        }

        PortataDTO portataDTO = (PortataDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, portataDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "PortataDTO{" +
            "id='" + getId() + "'" +
            ", tipo='" + getTipo() + "'" +
            ", nomeDefault='" + getNomeDefault() + "'" +
            ", nomePersonalizzato='" + getNomePersonalizzato() + "'" +
            ", menu=" + getMenu() +
            "}";
    }
}
