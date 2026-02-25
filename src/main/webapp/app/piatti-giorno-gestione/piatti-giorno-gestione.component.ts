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
  prodotto?: { id: string; nome: string; descrizione?: string; prezzo: number; allergenis?: any[] };
  allergenis?: any[];
  menu?: { id: string; nome?: string };
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

  nome = '';
  descrizione = '';
  prezzo: number | null = null;
  prodottoSelezionato: string | null = null;

  menus: any[] = [];
  portate: any[] = [];
  prodotti: any[] = [];
  menuSelezionato: string | null = null;
  menuNuovoPiatto: string | null = null;
  portataSelezionata: string | null = null;

  private _prodottoDettaglio: any | null = null;
  private _menuDettaglio: any | null = null;

  allergeniDisponibili: any[] = [];
  allergeniSelezionati: Set<string> = new Set();
  nomeAllergeneCustom = '';

  // prodottiMap: String(prodotto.id) -> prodotto completo (da by-portata, ha allergenis)
  private prodottiMap: Map<string, any> = new Map();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.caricaTutto();
  }

  async caricaTutto(): Promise<void> {
    // Step 1: allergeni e menu in parallelo
    await Promise.all([this.caricaAllergeni(), this.caricaMenus()]);
    // Step 2: costruisce mappa prodotti (richiede menus già caricati)
    await this.costruisciProdottiMap();
    // Step 3: carica piatti e arricchisce
    await this.caricaPiattiGiorno();
  }

  async caricaAllergeni(): Promise<void> {
    try {
      this.allergeniDisponibili = (await this.http.get<any[]>('/api/allergenes').toPromise()) ?? [];
    } catch (err) {
      console.error('Errore allergeni:', err);
    }
  }

  async caricaMenus(): Promise<void> {
    try {
      const currentUser: any = await this.http.get('/api/account').toPromise();
      const tutti: any[] = (await this.http.get<any[]>('/api/menus').toPromise()) ?? [];
      this.menus = tutti.filter(m => m.ristoratore?.login === currentUser.login);
    } catch (err) {
      console.error('Errore menu:', err);
    }
  }

  /**
   * Costruisce prodottiMap usando /api/prodottos/by-portata/{id}
   * che è l'unico endpoint che restituisce allergenis popolati.
   */
  private async costruisciProdottiMap(): Promise<void> {
    try {
      for (const menu of this.menus) {
        const portate: any[] = (await this.http.get<any[]>(`/api/menus/${menu.id}/portatas`).toPromise()) ?? [];
        for (const portata of portate) {
          const prods: any[] = (await this.http.get<any[]>(`/api/prodottos/by-portata/${portata.id}`).toPromise()) ?? [];
          prods.forEach(p => this.prodottiMap.set(String(p.id), p));
        }
      }
    } catch (err) {
      console.warn('Errore costruzione mappa prodotti:', err);
    }
  }

  async caricaPiattiGiorno(): Promise<void> {
    try {
      const piatti = (await this.http.get<PiattoDelGiorno[]>('/api/piatto-del-giornos').toPromise()) ?? [];
      this.piattiGiorno = piatti.map(p => this.arricchisciPiatto(p));
    } catch (err) {
      console.error('Errore piatti del giorno:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Arricchisce un piatto con i dati completi di prodotto e allergeni.
   *
   * Caso A — piatto da menu (prodotto.id presente):
   *   Cerca il prodotto in prodottiMap → ha allergenis completi
   *
   * Caso B — piatto personalizzato (prodotto null):
   *   Il GET restituisce allergenis come [{id:"uuid"}] senza icona/colore
   *   → cerca ogni allergene in allergeniDisponibili per ID
   */
  private arricchisciPiatto(piatto: PiattoDelGiorno): PiattoDelGiorno {
    // CASO A: piatto collegato a un prodotto del menu
    if (piatto.prodotto?.id) {
      const prodCompleto = this.prodottiMap.get(String(piatto.prodotto.id));
      if (prodCompleto) {
        return {
          ...piatto,
          prodotto: {
            ...prodCompleto,
            allergenis: this.arricchisciAllergeni(prodCompleto.allergenis ?? []),
          },
        };
      }
      // prodotto non in mappa (menu diverso): arricchisce quelli già presenti
      if (piatto.prodotto.allergenis?.length) {
        return {
          ...piatto,
          prodotto: {
            ...piatto.prodotto,
            allergenis: this.arricchisciAllergeni(piatto.prodotto.allergenis),
          },
        };
      }
      return piatto;
    }

    // CASO B: piatto personalizzato
    // allergenis può essere [{id:"uuid"}] oppure oggetti parziali
    return {
      ...piatto,
      allergenis: this.arricchisciAllergeni(piatto.allergenis ?? []),
    };
  }

  /**
   * Dato un array di allergeni (anche solo [{id:"uuid"}]),
   * sostituisce ogni elemento con l'oggetto completo da allergeniDisponibili.
   * Se non trovato per ID, tenta per nome. Altrimenti lascia l'originale.
   */
  private arricchisciAllergeni(lista: any[]): any[] {
    return lista.map(a => {
      // Già completo
      if (a.icona && a.iconaContentType) return a;
      // Cerca per ID
      if (a.id != null) {
        const trovato = this.allergeniDisponibili.find(d => String(d.id) === String(a.id));
        if (trovato) return trovato;
      }
      // Fallback per nome
      if (a.nome) {
        const trovato = this.allergeniDisponibili.find(d => d.nome.toLowerCase().trim() === a.nome.toLowerCase().trim());
        if (trovato) return trovato;
      }
      return a;
    });
  }

  getAllergeneById(id: string): any {
    return this.allergeniDisponibili.find(a => String(a.id) === String(id)) ?? null;
  }

  getAllergeniPiatto(piatto: PiattoDelGiorno): any[] {
    const lista: any[] = piatto.prodotto?.allergenis ?? piatto.allergenis ?? [];
    // Sicurezza extra: ri-arricchisce nel caso non fosse stato fatto
    return this.arricchisciAllergeni(lista);
  }

  async onMenuSelezionato(): Promise<void> {
    if (!this.menuSelezionato) return;
    this.portate = [];
    this.prodotti = [];
    this.portataSelezionata = null;
    this.prodottoSelezionato = null;
    this._prodottoDettaglio = null;
    this._menuDettaglio = this.menus.find(m => m.id === this.menuSelezionato) ?? null;
    try {
      this.portate = (await this.http.get<any[]>(`/api/menus/${this.menuSelezionato}/portatas`).toPromise()) ?? [];
    } catch (err) {
      console.error('Errore portate:', err);
    }
  }

  async onPortataSelezionata(): Promise<void> {
    if (!this.portataSelezionata) return;
    this.prodotti = [];
    this.prodottoSelezionato = null;
    this._prodottoDettaglio = null;
    try {
      const prods: any[] = (await this.http.get<any[]>(`/api/prodottos/by-portata/${this.portataSelezionata}`).toPromise()) ?? [];
      prods.forEach(p => this.prodottiMap.set(String(p.id), p));
      this.prodotti = prods;
    } catch (err) {
      console.error('Errore prodotti:', err);
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
    this._prodottoDettaglio = null;
    this._menuDettaglio = null;
  }

  formValido(): boolean {
    if (this.modalitaSelezioneProdotto) return this.prodottoSelezionato !== null && this.menuSelezionato !== null;
    return this.nome.trim() !== '' && this.prezzo !== null && this.prezzo > 0 && this.menuNuovoPiatto !== null;
  }

  toggleAllergene(id: string): void {
    if (this.allergeniSelezionati.has(id)) this.allergeniSelezionati.delete(id);
    else this.allergeniSelezionati.add(id);
    this.allergeniSelezionati = new Set(this.allergeniSelezionati);
  }

  aggiungiAllergeneCustom(): void {
    const nome = this.nomeAllergeneCustom.trim();
    if (!nome) return;
    const idTemp = 'custom_' + Date.now();
    const custom = { id: idTemp, nome, icona: null, iconaContentType: null, colore: '#607D8B', isCustom: true };
    this.allergeniDisponibili = [...this.allergeniDisponibili, custom];
    this.allergeniSelezionati = new Set([...this.allergeniSelezionati, idTemp]);
    this.nomeAllergeneCustom = '';
  }

  selezionaESalvaProdotto(prod: any): void {
    this._prodottoDettaglio = prod;
    this.prodottoSelezionato = prod.id;
    this.salvaPiatto();
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

      const piattoRisposta: any = await this.http.post('/api/piatto-del-giornos', body).toPromise();
      let piattoArricchito: PiattoDelGiorno;

      if (this.modalitaSelezioneProdotto && this._prodottoDettaglio) {
        // _prodottoDettaglio viene da by-portata → ha allergenis completi
        const menuInfo = this._menuDettaglio ?? this.menus.find(m => m.id === this.menuSelezionato);
        piattoArricchito = {
          ...piattoRisposta,
          attivo: true,
          prodotto: {
            id: this._prodottoDettaglio.id,
            nome: this._prodottoDettaglio.nome,
            descrizione: this._prodottoDettaglio.descrizione,
            prezzo: this._prodottoDettaglio.prezzo,
            allergenis: this.arricchisciAllergeni(this._prodottoDettaglio.allergenis ?? []),
          },
          menu: menuInfo ? { id: menuInfo.id, nome: menuInfo.nome } : piattoRisposta.menu,
        };
      } else {
        // Piatto personalizzato: costruisce allergenis dagli ID selezionati
        const menuInfo = this.menus.find(m => m.id === this.menuNuovoPiatto);
        piattoArricchito = {
          ...piattoRisposta,
          attivo: true,
          menu: menuInfo ? { id: menuInfo.id, nome: menuInfo.nome } : piattoRisposta.menu,
          // Prende gli oggetti completi direttamente da allergeniDisponibili
          allergenis: Array.from(this.allergeniSelezionati)
            .map(id => this.getAllergeneById(id))
            .filter(Boolean),
        };
      }

      this.piattiGiorno = [piattoArricchito, ...this.piattiGiorno];
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
      console.error('Errore toggle:', err);
      piatto.attivo = !nuovoStato;
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
    return p.prodotto?.descrizione ?? p.descrizione;
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
