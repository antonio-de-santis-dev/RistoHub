package main.service.dto;

import java.util.List;

/**
 * DTO che rappresenta il risultato dell'analisi di un PDF di importazione menu.
 *
 * Struttura attesa nel PDF:
 *   PORTATA: <nomePortata>
 *   - <nomeProdotto> | <descrizione> | <prezzo>
 *   - ...
 *   PORTATA: <altraPortata>
 *   - ...
 */
public class PdfImportResultDTO {

    /** Lista di portate con i relativi prodotti estratti dal PDF */
    private List<PortataImportDTO> portate;

    /** Numero totale di prodotti trovati */
    private int totaleProdotti;

    /** Eventuali righe non riconosciute / avvisi di parsing */
    private List<String> avvisi;

    public PdfImportResultDTO() {}

    public PdfImportResultDTO(List<PortataImportDTO> portate, int totaleProdotti, List<String> avvisi) {
        this.portate = portate;
        this.totaleProdotti = totaleProdotti;
        this.avvisi = avvisi;
    }

    public List<PortataImportDTO> getPortate() {
        return portate;
    }

    public void setPortate(List<PortataImportDTO> portate) {
        this.portate = portate;
    }

    public int getTotaleProdotti() {
        return totaleProdotti;
    }

    public void setTotaleProdotti(int totaleProdotti) {
        this.totaleProdotti = totaleProdotti;
    }

    public List<String> getAvvisi() {
        return avvisi;
    }

    public void setAvvisi(List<String> avvisi) {
        this.avvisi = avvisi;
    }

    // ── Classi interne ────────────────────────────────────────────────────────

    public static class PortataImportDTO {

        private String nomePortata;
        private List<ProdottoImportDTO> prodotti;

        public PortataImportDTO() {}

        public PortataImportDTO(String nomePortata, List<ProdottoImportDTO> prodotti) {
            this.nomePortata = nomePortata;
            this.prodotti = prodotti;
        }

        public String getNomePortata() {
            return nomePortata;
        }

        public void setNomePortata(String nomePortata) {
            this.nomePortata = nomePortata;
        }

        public List<ProdottoImportDTO> getProdotti() {
            return prodotti;
        }

        public void setProdotti(List<ProdottoImportDTO> prodotti) {
            this.prodotti = prodotti;
        }
    }

    public static class ProdottoImportDTO {

        private String nome;
        private String descrizione;
        private String prezzo;

        public ProdottoImportDTO() {}

        public ProdottoImportDTO(String nome, String descrizione, String prezzo) {
            this.nome = nome;
            this.descrizione = descrizione;
            this.prezzo = prezzo;
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

        public String getPrezzo() {
            return prezzo;
        }

        public void setPrezzo(String prezzo) {
            this.prezzo = prezzo;
        }
    }
}
