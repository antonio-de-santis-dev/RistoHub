package main.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * A DTO for the {@link main.domain.Menu} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class MenuDTO implements Serializable {

    private UUID id;

    @NotNull
    private String nome;

    private String descrizione;

    @NotNull
    private Boolean attivo;

    private String templateStyle;

    private String colorePrimario;

    private String coloreSecondario;

    private String fontMenu;

    @NotNull
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

    public String getDescrizione() {
        return descrizione;
    }

    public void setDescrizione(String descrizione) {
        this.descrizione = descrizione;
    }

    public Boolean getAttivo() {
        return attivo;
    }

    public void setAttivo(Boolean attivo) {
        this.attivo = attivo;
    }

    public String getTemplateStyle() {
        return templateStyle;
    }

    public void setTemplateStyle(String templateStyle) {
        this.templateStyle = templateStyle;
    }

    public String getColorePrimario() {
        return colorePrimario;
    }

    public void setColorePrimario(String colorePrimario) {
        this.colorePrimario = colorePrimario;
    }

    public String getColoreSecondario() {
        return coloreSecondario;
    }

    public void setColoreSecondario(String coloreSecondario) {
        this.coloreSecondario = coloreSecondario;
    }

    public String getFontMenu() {
        return fontMenu;
    }

    public void setFontMenu(String fontMenu) {
        this.fontMenu = fontMenu;
    }

    public UserDTO getRistoratore() {
        return ristoratore;
    }

    public void setRistoratore(UserDTO ristoratore) {
        this.ristoratore = ristoratore;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof MenuDTO)) {
            return false;
        }

        MenuDTO menuDTO = (MenuDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, menuDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "MenuDTO{" +
            "id='" + getId() + "'" +
            ", nome='" + getNome() + "'" +
            ", descrizione='" + getDescrizione() + "'" +
            ", attivo='" + getAttivo() + "'" +
            ", templateStyle='" + getTemplateStyle() + "'" +
            ", colorePrimario='" + getColorePrimario() + "'" +
            ", coloreSecondario='" + getColoreSecondario() + "'" +
            ", fontMenu='" + getFontMenu() + "'" +
            ", ristoratore=" + getRistoratore() +
            "}";
    }
}
