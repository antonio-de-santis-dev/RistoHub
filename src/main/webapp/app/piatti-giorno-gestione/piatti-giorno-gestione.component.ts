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
  prodotto?: { id: string; nome: string; prezzo: number; allergenis?: any[] };
  allergenis?: any[];
  menu?: { id: string; nome?: string }; // ← aggiunto nome?: string
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

  piattiGiorno: PiattoDelGiorno[] = [];

  modaleCreazioneAperto = false;
  modalitaSelezioneProdotto = false;

  // Form fields
  nome = '';
  descrizione = '';
  prezzo: number | null = null;
  prodottoSelezionato: string | null = null;

  // Navigation
  menus: any[] = [];
  portate: any[] = [];
  prodotti: any[] = [];
  menuSelezionato: string | null = null;
  menuNuovoPiatto: string | null = null;
  portataSelezionata: string | null = null;

  // Allergeni
  allergeniDisponibili: any[] = [];
  allergeniSelezionati: Set<string> = new Set();
  nomeAllergeneCustom = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.caricaPiattiGiorno();
    this.caricaMenus();
    this.caricaAllergeni();
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

  async caricaAllergeni(): Promise<void> {
    try {
      this.allergeniDisponibili = (await this.http.get<any[]>('/api/allergenes').toPromise()) ?? [];
    } catch (err) {
      console.error('Errore caricamento allergeni:', err);
    }
  }

  // ─── ALLERGENI ───

  toggleAllergene(id: string): void {
    if (this.allergeniSelezionati.has(id)) {
      this.allergeniSelezionati.delete(id);
    } else {
      this.allergeniSelezionati.add(id);
    }
    this.allergeniSelezionati = new Set(this.allergeniSelezionati);
  }

  aggiungiAllergeneCustom(): void {
    const nome = this.nomeAllergeneCustom.trim();
    if (!nome) return;
    const idTemp = 'custom_' + Date.now();
    const custom = {
      id: idTemp,
      nome,
      icona: null,
      iconaContentType: null,
      colore: '#607D8B',
      isCustom: true,
    };
    this.allergeniDisponibili = [...this.allergeniDisponibili, custom];
    this.allergeniSelezionati = new Set([...this.allergeniSelezionati, idTemp]);
    this.nomeAllergeneCustom = '';
  }

  get allergeniSelezionatiArray(): string[] {
    return Array.from(this.allergeniSelezionati);
  }

  getAllergeneById(id: string): any {
    return this.allergeniDisponibili.find(a => a.id === id) ?? null;
  }

  getAllergeniPiatto(piatto: PiattoDelGiorno): any[] {
    return piatto.prodotto?.allergenis ?? piatto.allergenis ?? [];
  }

  // ─── NAVIGAZIONE MENU/PORTATE ───

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
    this.menuNuovoPiatto = null;
    this.portataSelezionata = null;
    this.portate = [];
    this.prodotti = [];
    this.allergeniSelezionati = new Set();
    this.nomeAllergeneCustom = '';
    this.successMessage = null;
    this.errorMessage = null;
  }

  formValido(): boolean {
    if (this.modalitaSelezioneProdotto) {
      return this.prodottoSelezionato !== null && this.menuSelezionato !== null;
    }
    return this.nome.trim() !== '' && this.prezzo !== null && this.prezzo > 0 && this.menuNuovoPiatto !== null;
  }

  async salvaPiatto(): Promise<void> {
    if (!this.formValido()) return;
    this.isSaving = true;
    this.successMessage = null;
    this.errorMessage = null;

    try {
      const allergeni = Array.from(this.allergeniSelezionati)
        .filter(id => !id.startsWith('custom_'))
        .map(id => ({ id }));

      let body: any = { attivo: true };

      if (this.modalitaSelezioneProdotto && this.prodottoSelezionato) {
        body.prodotto = { id: this.prodottoSelezionato };
        body.menu = { id: this.menuSelezionato };
        body.nome = null;
        body.descrizione = null;
        body.prezzo = null;
      } else {
        body.nome = this.nome.trim();
        body.descrizione = this.descrizione.trim() || null;
        body.prezzo = this.prezzo;
        body.prodotto = null;
        body.menu = { id: this.menuNuovoPiatto };
        body.allergenis = allergeni;
      }

      const piatto: any = await this.http.post('/api/piatto-del-giornos', body).toPromise();

      if (!this.modalitaSelezioneProdotto) {
        piatto.allergenis = Array.from(this.allergeniSelezionati)
          .map(id => this.getAllergeneById(id))
          .filter(Boolean);
      }

      this.piattiGiorno.unshift(piatto);
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
    const nuovoStato = !piatto.attivo;
    piatto.attivo = nuovoStato;
    try {
      try {
        await this.http.patch(`/api/piatto-del-giornos/${piatto.id}`, { id: piatto.id, attivo: nuovoStato }).toPromise();
      } catch {
        await this.http.put(`/api/piatto-del-giornos/${piatto.id}`, { ...piatto }).toPromise();
      }
    } catch (err) {
      console.error('Errore toggle attivo:', err);
      piatto.attivo = !nuovoStato; // rollback
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
