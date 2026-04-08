package main.service.dto;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/**
 * OPT-07: DTO leggero per ImmagineMenu — esclude il campo immagine (byte[]).
 *
 * Usato esclusivamente nella risposta di aggiornaOrdineEVisibilita().
 * L'operazione modifica solo ordine e visibilità: ricaricare i blob nella
 * risposta di conferma è inutile e spreca banda (ogni immagine può essere
 * centinaia di KB o MB).
 *
 * Il frontend usa questo DTO per aggiornare lo stato locale senza dover
 * ricaricare l'intera lista con i blob.
 */
public class ImmagineMenuMetaDTO implements Serializable {

    private UUID id;
    private String nome;
    private String immagineContentType;
    private String tipo;
    private Integer ordine;
    private Boolean visibile;
    /** URL diretto al bytes dell'immagine — cacheable dal browser (max-age=86400). */
    private String contentUrl;

    public ImmagineMenuMetaDTO() {}

    // ── Costruttore da proiezione repository ─────────────────────────────────
    public ImmagineMenuMetaDTO(
        UUID id,
        String nome,
        String immagineContentType,
        String tipo,
        Integer ordine,
        Boolean visibile,
        String contentUrl
    ) {
        this.id = id;
        this.nome = nome;
        this.immagineContentType = immagineContentType;
        this.tipo = tipo;
        this.ordine = ordine;
        this.visibile = visibile;
        this.contentUrl = contentUrl;
    }

    // ── Getter / Setter ───────────────────────────────────────────────────────

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

    public String getImmagineContentType() {
        return immagineContentType;
    }

    public void setImmagineContentType(String immagineContentType) {
        this.immagineContentType = immagineContentType;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public Integer getOrdine() {
        return ordine;
    }

    public void setOrdine(Integer ordine) {
        this.ordine = ordine;
    }

    public Boolean getVisibile() {
        return visibile;
    }

    public void setVisibile(Boolean visibile) {
        this.visibile = visibile;
    }

    public String getContentUrl() {
        return contentUrl;
    }

    public void setContentUrl(String contentUrl) {
        this.contentUrl = contentUrl;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ImmagineMenuMetaDTO)) return false;
        ImmagineMenuMetaDTO that = (ImmagineMenuMetaDTO) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return (
            "ImmagineMenuMetaDTO{id='" +
            id +
            "', tipo='" +
            tipo +
            "', ordine=" +
            ordine +
            ", visibile=" +
            visibile +
            ", contentUrl='" +
            contentUrl +
            "'}"
        );
    }
}
