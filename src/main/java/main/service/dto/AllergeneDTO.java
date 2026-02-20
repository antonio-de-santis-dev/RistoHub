package main.service.dto;

import jakarta.persistence.Column;
import jakarta.persistence.Lob;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.*;

/**
 * A DTO for the {@link main.domain.Allergene} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class AllergeneDTO implements Serializable {

    private UUID id;

    @NotNull
    private String nome;

    private byte[] icona;

    private String iconaContentType;

    private String colore;

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

    @Override
    public String toString() {
        return (
            "AllergeneDTO{" +
            "id=" +
            id +
            ", nome='" +
            nome +
            '\'' +
            ", icona=" +
            Arrays.toString(icona) +
            ", iconaContentType='" +
            iconaContentType +
            '\'' +
            ", colore='" +
            colore +
            '\'' +
            ", prodottos=" +
            prodottos +
            '}'
        );
    }
}
