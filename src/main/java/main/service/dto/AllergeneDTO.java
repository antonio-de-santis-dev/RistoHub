package main.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * A DTO for the {@link main.domain.Allergene} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class AllergeneDTO implements Serializable {

    private UUID id;

    @NotNull
    private String nome;

    private String simbolo;

    private Set<ProdottoDTO> prodottos = new HashSet<>();

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

    public String getSimbolo() {
        return simbolo;
    }

    public void setSimbolo(String simbolo) {
        this.simbolo = simbolo;
    }

    public Set<ProdottoDTO> getProdottos() {
        return prodottos;
    }

    public void setProdottos(Set<ProdottoDTO> prodottos) {
        this.prodottos = prodottos;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof AllergeneDTO)) {
            return false;
        }

        AllergeneDTO allergeneDTO = (AllergeneDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, allergeneDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "AllergeneDTO{" +
            "id='" + getId() + "'" +
            ", nome='" + getNome() + "'" +
            ", simbolo='" + getSimbolo() + "'" +
            ", prodottos=" + getProdottos() +
            "}";
    }
}
