import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Percorso immagine fallback per allergeni senza icona (inseriti manualmente).
// Posizionare il file in: src/main/webapp/content/images/allergene-manuale.png
const ALLERGENE_MANUALE_ICONA = 'content/images/allergene-manuale.png';

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

  // ── Eliminazione ──
  modaleEliminazioneAperto = false;
  piattoInEliminazione: PiattoDelGiorno | null = null;
  isDeleting = false;

  // ── Modifica ──
  modaleModificaAperto = false;
  piattoInModifica: PiattoDelGiorno | null = null;
  editNome = '';
  editDescrizione = '';
  editPrezzo: number | null = null;
  editMenuId: string | null = null;
  editAllergeniSelezionati: Set<string> = new Set();
  editNomeAllergeneCustom = '';
  isSavingEdit = false;
  editErrore: string | null = null;

  private prodottiMap: Map<string, any> = new Map();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.caricaTutto();
  }

  async caricaTutto(): Promise<void> {
    await Promise.all([this.caricaAllergeni(), this.caricaMenus()]);
    await this.costruisciProdottiMap();
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

  private arricchisciPiatto(piatto: PiattoDelGiorno): PiattoDelGiorno {
    if (piatto.prodotto?.id) {
      const prodCompleto = this.prodottiMap.get(String(piatto.prodotto.id));
      if (prodCompleto) {
        return { ...piatto, prodotto: { ...prodCompleto, allergenis: this.arricchisciAllergeni(prodCompleto.allergenis ?? []) } };
      }
      if (piatto.prodotto.allergenis?.length) {
        return { ...piatto, prodotto: { ...piatto.prodotto, allergenis: this.arricchisciAllergeni(piatto.prodotto.allergenis) } };
      }
      return piatto;
    }
    return { ...piatto, allergenis: this.arricchisciAllergeni(piatto.allergenis ?? []) };
  }

  private arricchisciAllergeni(lista: any[]): any[] {
    return lista.map(a => {
      if (a.icona && a.iconaContentType) return a;
      if (a.id != null) {
        const trovato = this.allergeniDisponibili.find(d => String(d.id) === String(a.id));
        if (trovato) return trovato;
      }
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
    return this.arricchisciAllergeni(lista);
  }

  /**
   * Restituisce l'URL dell'icona di un allergene.
   * Per gli allergeni senza icona (inseriti manualmente) usa l'immagine di fallback.
   */
  getAllergeneIcona(a: any): string {
    if (!a) return ALLERGENE_MANUALE_ICONA;
    // Icona diretta sull'oggetto
    if (a.icona && a.iconaContentType) {
      return `data:${a.iconaContentType};base64,${a.icona}`;
    }
    // Cerca nell'elenco locale per ID
    if (a.id != null) {
      const trovato = this.allergeniDisponibili.find(d => String(d.id) === String(a.id));
      if (trovato?.icona && trovato?.iconaContentType) {
        return `data:${trovato.iconaContentType};base64,${trovato.icona}`;
      }
    }
    // Cerca per nome
    if (a.nome) {
      const trovato = this.allergeniDisponibili.find(d => d.nome.toLowerCase().trim() === a.nome.toLowerCase().trim());
      if (trovato?.icona && trovato?.iconaContentType) {
        return `data:${trovato.iconaContentType};base64,${trovato.icona}`;
      }
    }
    // Fallback: icona generica per allergeni manuali
    return ALLERGENE_MANUALE_ICONA;
  }

  // ══════════════════════════════════════════════════
  //  ALLERGENI CUSTOM → PERSISTENZA NEL DB
  //
  //  Prima del salvataggio di qualsiasi piatto, crea nel DB
  //  tutti gli allergeni con ID temporaneo (custom_*).
  //  Restituisce la lista finale con gli ID reali del DB.
  // ══════════════════════════════════════════════════

  private async assicuraAllergeniNelDb(idSet: Set<string>): Promise<{ id: string }[]> {
    const risultato: { id: string }[] = [];
    for (const id of idSet) {
      if (!id.startsWith('custom_')) {
        // Allergene già persistito nel DB
        risultato.push({ id });
      } else {
        // Allergene custom: lo creiamo ora nel DB
        const locale = this.allergeniDisponibili.find(a => String(a.id) === id);
        if (!locale) continue;
        try {
          const creato: any = await this.http
            .post('/api/allergenes', {
              nome: locale.nome,
              colore: locale.colore ?? '#607D8B',
            })
            .toPromise();
          // Aggiorna l'ID temporaneo con quello reale nell'elenco locale
          const idx = this.allergeniDisponibili.findIndex(a => String(a.id) === id);
          if (idx !== -1) {
            this.allergeniDisponibili[idx] = { ...this.allergeniDisponibili[idx], id: creato.id, isCustom: false };
          }
          risultato.push({ id: String(creato.id) });
        } catch (err) {
          console.error(`Errore creazione allergene custom "${locale.nome}":`, err);
          // Salta questo allergene, continua con gli altri
        }
      }
    }
    return risultato;
  }

  // ══════════════════════════════════════════════════
  //  MODIFICA
  // ══════════════════════════════════════════════════

  apriModaleModifica(piatto: PiattoDelGiorno): void {
    this.piattoInModifica = piatto;
    this.editErrore = null;
    this.editMenuId = piatto.menu?.id ?? null;

    if (piatto.prodotto) {
      this.editNome = piatto.prodotto.nome;
      this.editDescrizione = piatto.prodotto.descrizione ?? '';
      this.editPrezzo = piatto.prodotto.prezzo;
      this.editAllergeniSelezionati = new Set((piatto.prodotto.allergenis ?? []).map((a: any) => String(a.id)));
    } else {
      this.editNome = piatto.nome;
      this.editDescrizione = piatto.descrizione ?? '';
      this.editPrezzo = piatto.prezzo;
      this.editAllergeniSelezionati = new Set((piatto.allergenis ?? []).map((a: any) => String(a.id)));
    }

    this.editNomeAllergeneCustom = '';
    this.modaleModificaAperto = true;
  }

  chiudiModaleModifica(): void {
    if (this.isSavingEdit) return;
    this.modaleModificaAperto = false;
    this.piattoInModifica = null;
    this.editErrore = null;
  }

  toggleEditAllergene(id: string): void {
    if (this.editAllergeniSelezionati.has(id)) this.editAllergeniSelezionati.delete(id);
    else this.editAllergeniSelezionati.add(id);
    this.editAllergeniSelezionati = new Set(this.editAllergeniSelezionati);
  }

  aggiungiAllergeneCustomEdit(): void {
    const nome = this.editNomeAllergeneCustom.trim();
    if (!nome) return;
    const idTemp = 'custom_' + Date.now();
    const custom = { id: idTemp, nome, icona: null, iconaContentType: null, colore: '#607D8B', isCustom: true };
    this.allergeniDisponibili = [...this.allergeniDisponibili, custom];
    this.editAllergeniSelezionati = new Set([...this.editAllergeniSelezionati, idTemp]);
    this.editNomeAllergeneCustom = '';
  }

  editFormValido(): boolean {
    if (!this.editMenuId) return false;
    if (this.piattoInModifica?.prodotto) return true;
    return this.editNome.trim() !== '' && this.editPrezzo !== null && this.editPrezzo > 0;
  }

  async salvaModifica(): Promise<void> {
    if (!this.piattoInModifica?.id || !this.editFormValido()) return;
    this.isSavingEdit = true;
    this.editErrore = null;

    try {
      // ✅ Crea nel DB gli eventuali allergeni custom prima del salvataggio
      const allergeni = await this.assicuraAllergeniNelDb(this.editAllergeniSelezionati);

      const body: any = {
        id: this.piattoInModifica.id,
        attivo: this.piattoInModifica.attivo,
        menu: { id: this.editMenuId },
      };

      if (this.piattoInModifica.prodotto) {
        body.prodotto = { id: this.piattoInModifica.prodotto.id };
        body.nome = null;
        body.descrizione = null;
        body.prezzo = null;
        body.allergenis = [];
      } else {
        body.prodotto = null;
        body.nome = this.editNome.trim();
        body.descrizione = this.editDescrizione.trim() || null;
        body.prezzo = this.editPrezzo;
        body.allergenis = allergeni;
      }

      await this.http.put(`/api/piatto-del-giornos/${this.piattoInModifica.id}`, body).toPromise();

      const menuInfo = this.menus.find(m => m.id === this.editMenuId);
      this.piattiGiorno = this.piattiGiorno.map(p => {
        if (p.id !== this.piattoInModifica!.id) return p;
        const aggiornato: PiattoDelGiorno = {
          ...p,
          menu: menuInfo ? { id: menuInfo.id, nome: menuInfo.nome } : { id: this.editMenuId! },
        };
        if (!p.prodotto) {
          aggiornato.nome = this.editNome.trim();
          aggiornato.descrizione = this.editDescrizione.trim() || undefined;
          aggiornato.prezzo = this.editPrezzo!;
          // ✅ IDs reali post-creazione allergeni
          aggiornato.allergenis = allergeni.map(a => this.getAllergeneById(a.id)).filter(Boolean);
        }
        return aggiornato;
      });

      this.isSavingEdit = false;
      this.chiudiModaleModifica();
    } catch (err) {
      console.error('Errore modifica:', err);
      this.editErrore = '❌ Errore durante il salvataggio. Riprova.';
      this.isSavingEdit = false;
    }
  }

  // ══════════════════════════════════════════════════
  //  ELIMINAZIONE
  // ══════════════════════════════════════════════════

  apriModaleEliminazione(piatto: PiattoDelGiorno): void {
    this.piattoInEliminazione = piatto;
    this.modaleEliminazioneAperto = true;
  }

  chiudiModaleEliminazione(): void {
    if (this.isDeleting) return;
    this.piattoInEliminazione = null;
    this.modaleEliminazioneAperto = false;
  }

  async confermaEliminazione(): Promise<void> {
    if (!this.piattoInEliminazione?.id) return;
    this.isDeleting = true;
    try {
      await this.http.delete(`/api/piatto-del-giornos/${this.piattoInEliminazione.id}`).toPromise();
      this.piattiGiorno = this.piattiGiorno.filter(p => p.id !== this.piattoInEliminazione!.id);
      this.isDeleting = false; // ✅ reset PRIMA di chiudere
      this.chiudiModaleEliminazione();
    } catch (err) {
      console.error('Errore eliminazione:', err);
      this.isDeleting = false;
    }
  }

  // ══════════════════════════════════════════════════
  //  CREAZIONE
  // ══════════════════════════════════════════════════

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
      let allergeni: { id: string }[] = [];

      if (!this.modalitaSelezioneProdotto) {
        // ✅ Crea nel DB gli eventuali allergeni custom prima del salvataggio
        allergeni = await this.assicuraAllergeniNelDb(this.allergeniSelezionati);
      }

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
        const menuInfo = this.menus.find(m => m.id === this.menuNuovoPiatto);
        piattoArricchito = {
          ...piattoRisposta,
          attivo: true,
          menu: menuInfo ? { id: menuInfo.id, nome: menuInfo.nome } : piattoRisposta.menu,
          // ✅ IDs reali post-creazione allergeni
          allergenis: allergeni.map(a => this.getAllergeneById(a.id)).filter(Boolean),
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
