package main.service.dto;

import jakarta.persistence.Lob;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;
import main.domain.enumeration.TipoImmagine;

/**
 * A DTO for the {@link main.domain.ImmagineMenu} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ImmagineMenuDTO implements Serializable {

    private UUID id;

    private String nome;

    @Lob
    private byte[] immagine;

    private String immagineContentType;

    private String contentType;

    @NotNull
    private TipoImmagine tipo;

    @NotNull
    private MenuDTO menu;

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

    public byte[] getImmagine() {
        return immagine;
    }

    public void setImmagine(byte[] immagine) {
        this.immagine = immagine;
    }

    public String getImmagineContentType() {
        return immagineContentType;
    }

    public void setImmagineContentType(String immagineContentType) {
        this.immagineContentType = immagineContentType;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public TipoImmagine getTipo() {
        return tipo;
    }

    public void setTipo(TipoImmagine tipo) {
        this.tipo = tipo;
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
        if (!(o instanceof ImmagineMenuDTO)) {
            return false;
        }

        ImmagineMenuDTO immagineMenuDTO = (ImmagineMenuDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, immagineMenuDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ImmagineMenuDTO{" +
            "id='" + getId() + "'" +
            ", nome='" + getNome() + "'" +
            ", immagine='" + getImmagine() + "'" +
            ", contentType='" + getContentType() + "'" +
            ", tipo='" + getTipo() + "'" +
            ", menu=" + getMenu() +
            "}";
    }
}
