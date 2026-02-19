import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface PiattoDelGiorno {
  id?: string;
  nome: string;
  descrizione?: string;
  prezzo: number;
  attivo: boolean;
  prodotto?: { id: string; nome: string; prezzo: number };
  menu?: { id: string }; // ← AGGIUNTO: riferimento al menu di appartenenza
}

@Component({
  selector: 'jhi-piatti-giorno-gestione',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './piatti-giorno-gestione.component.html',
  styleUrls: ['./piatti-giorno-gestione.component.scss'],
})
export class PiattiGiornoGestioneComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // Lista piatti del giorno
  piattiGiorno: PiattoDelGiorno[] = [];

  // Form nuovo piatto
  modaleCreazioneAperto = false;
  modalitaSelezioneProdotto = false; // true = seleziona prodotto, false = crea nuovo

  // Campi form
  nome = '';
  descrizione = '';
  prezzo: number | null = null;
  prodottoSelezionato: string | null = null;

  // Prodotti disponibili
  menus: any[] = [];
  portate: any[] = [];
  prodotti: any[] = [];
  menuSelezionato: string | null = null; // menu per navigare portate/prodotti (usato anche come menu del piatto DA MENU)
  menuNuovoPiatto: string | null = null; // ← AGGIUNTO: menu scelto per piatto creato manualmente
  portataSelezionata: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.caricaPiattiGiorno();
    this.caricaMenus();
  }

  async caricaPiattiGiorno(): Promise<void> {
    try {
      this.piattiGiorno = (await this.http.get<PiattoDelGiorno[]>('/api/piatto-del-giornos').toPromise()) ?? [];
    } catch (err) {
      console.error('Errore caricamento piatti del giorno:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async caricaMenus(): Promise<void> {
    try {
      const currentUser: any = await this.http.get('/api/account').toPromise();
      const tutti: any[] = (await this.http.get<any[]>('/api/menus').toPromise()) ?? [];
      this.menus = tutti.filter(m => m.ristoratore?.login === currentUser.login);
    } catch (err) {
      console.error('Errore caricamento menu:', err);
    }
  }

  async onMenuSelezionato(): Promise<void> {
    if (!this.menuSelezionato) return;
    this.portate = [];
    this.prodotti = [];
    this.portataSelezionata = null;
    this.prodottoSelezionato = null;
    try {
      this.portate = (await this.http.get<any[]>(`/api/menus/${this.menuSelezionato}/portatas`).toPromise()) ?? [];
    } catch (err) {
      console.error('Errore caricamento portate:', err);
    }
  }

  async onPortataSelezionata(): Promise<void> {
    if (!this.portataSelezionata) return;
    this.prodotti = [];
    this.prodottoSelezionato = null;
    try {
      this.prodotti = (await this.http.get<any[]>(`/api/prodottos/by-portata/${this.portataSelezionata}`).toPromise()) ?? [];
    } catch (err) {
      console.error('Errore caricamento prodotti:', err);
    }
  }

  apriModaleCrea(): void {
    this.modaleCreazioneAperto = true;
    this.modalitaSelezioneProdotto = false;
    this.resetForm();
  }

  apriModaleSeleziona(): void {
    this.modaleCreazioneAperto = true;
    this.modalitaSelezioneProdotto = true;
    this.resetForm();
  }

  chiudiModale(): void {
    this.modaleCreazioneAperto = false;
    this.resetForm();
  }

  resetForm(): void {
    this.nome = '';
    this.descrizione = '';
    this.prezzo = null;
    this.prodottoSelezionato = null;
    this.menuSelezionato = null;
    this.menuNuovoPiatto = null; // ← AGGIUNTO
    this.portataSelezionata = null;
    this.portate = [];
    this.prodotti = [];
    this.successMessage = null;
    this.errorMessage = null;
  }

  formValido(): boolean {
    if (this.modalitaSelezioneProdotto) {
      // Piatto da menu: serve prodotto E menu selezionato
      return this.prodottoSelezionato !== null && this.menuSelezionato !== null;
    }
    // Piatto nuovo: serve nome, prezzo E menu di destinazione
    return (
      this.nome.trim() !== '' && this.prezzo !== null && this.prezzo > 0 && this.menuNuovoPiatto !== null // ← AGGIUNTO: obbligatorio
    );
  }

  async salvaPiatto(): Promise<void> {
    if (!this.formValido()) return;
    this.isSaving = true;
    this.successMessage = null;
    this.errorMessage = null;

    try {
      let body: any = {
        attivo: true,
      };

      if (this.modalitaSelezioneProdotto && this.prodottoSelezionato) {
        // Piatto collegato a prodotto esistente
        // Il menu è quello usato per navigare portate/prodotti
        body.prodotto = { id: this.prodottoSelezionato };
        body.menu = { id: this.menuSelezionato }; // ← AGGIUNTO
        body.nome = null;
        body.descrizione = null;
        body.prezzo = null;
      } else {
        // Piatto creato manualmente
        body.nome = this.nome.trim();
        body.descrizione = this.descrizione.trim() || null;
        body.prezzo = this.prezzo;
        body.prodotto = null;
        body.menu = { id: this.menuNuovoPiatto }; // ← AGGIUNTO
      }

      const piatto: any = await this.http.post('/api/piatto-del-giornos', body).toPromise();
      this.piattiGiorno.unshift(piatto);
      this.successMessage = '✅ Piatto aggiunto con successo!';
      this.chiudiModale();
    } catch (err) {
      console.error('Errore salvataggio:', err);
      this.errorMessage = '❌ Errore durante il salvataggio. Riprova.';
    } finally {
      this.isSaving = false;
    }
  }

  async toggleAttivo(piatto: PiattoDelGiorno): Promise<void> {
    if (!piatto.id) return;
    try {
      piatto.attivo = !piatto.attivo;
      await this.http
        .put(`/api/piatto-del-giornos/${piatto.id}`, {
          ...piatto,
        })
        .toPromise();
    } catch (err) {
      console.error('Errore toggle attivo:', err);
      piatto.attivo = !piatto.attivo; // rollback
    }
  }

  async eliminaPiatto(id: string): Promise<void> {
    if (!confirm('Eliminare questo piatto del giorno?')) return;
    try {
      await this.http.delete(`/api/piatto-del-giornos/${id}`).toPromise();
      this.piattiGiorno = this.piattiGiorno.filter(p => p.id !== id);
    } catch (err) {
      console.error('Errore eliminazione:', err);
    }
  }

  nomePiatto(p: PiattoDelGiorno): string {
    return p.prodotto?.nome ?? p.nome;
  }

  descrizionePiatto(p: PiattoDelGiorno): string | undefined {
    return p.descrizione;
  }

  prezzoPiatto(p: PiattoDelGiorno): number {
    return p.prodotto?.prezzo ?? p.prezzo;
  }

  formatPrezzo(p: number): string {
    return `€ ${Number(p).toFixed(2).replace('.', ',')}`;
  }

  nomePortata(p: any): string {
    if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) return p.nomePersonalizzato;
    return (p.nomeDefault ?? '').replace(/_/g, ' ');
  }
}
