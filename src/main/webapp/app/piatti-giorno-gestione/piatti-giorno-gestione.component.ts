import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  AccountDTO,
  AllergeneDTO,
  AllergeneUI,
  MenuDTO,
  PiattoDelGiornoDTO,
  PiattoDelGiornoBody,
  PortataDTO,
  ProdottoDTO,
} from 'app/shared/model/risto.model';

const ALLERGENE_MANUALE_ICONA = 'content/images/allergene-manuale.png';
const ALLERGENI_ICONE_BASE = 'content/images/iconeAlergeni/';

const ALLERGENE_ICONE_MAP: Record<string, string> = {
  glutine: 'Glutine.png',
  crostacei: 'Crostacei.png',
  uova: 'Uova.png',
  pesce: 'Pesce.png',
  arachidi: 'Arachidi.png',
  soia: 'Soia.png',
  latte: 'Latte.png',
  'frutta a guscio': 'Frutta_a_guscio.png',
  sedano: 'Sedano.png',
  senape: 'Senape.png',
  sesamo: 'Sesamo.png',
  'anidride solforosa': 'anidride_solforosa.png',
  lupini: 'lupoli.png',
  molluschi: 'Moluschi.png',
};

interface PiattoGruppo {
  key: string;
  entries: PiattoDelGiornoDTO[];
  isFromMenu: boolean;
  isMulti: boolean;
  nome: string;
  descrizione?: string | null;
  prezzo: number;
  allergeni: AllergeneDTO[];
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

  piattiGiorno: PiattoDelGiornoDTO[] = [];
  modaleCreazioneAperto = false;
  modalitaSelezioneProdotto = false;

  nome = '';
  descrizione = '';
  prezzo: number | null = null;
  prodottoSelezionato: string | null = null;

  menus: MenuDTO[] = [];
  portate: PortataDTO[] = [];
  prodotti: ProdottoDTO[] = [];

  // "Crea Nuovo": set di menu selezionati (multi)
  menuNuovoPiattoIds: Set<string> = new Set();

  // "Da Menu": menu sorgente per sfogliare portate/prodotti
  menuSelezionato: string | null = null;
  portataSelezionata: string | null = null;

  // "Da Menu": step 4 — selezione menu di destinazione (multi)
  step4DaMenuAttivo = false;
  menuDestinazioneIds: Set<string> = new Set();

  _prodottoDettaglio: ProdottoDTO | null = null;
  _menuDettaglio: MenuDTO | null = null;

  allergeniDisponibili: AllergeneUI[] = [];
  allergeniSelezionati: Set<string> = new Set();
  nomeAllergeneCustom = '';

  // ── Eliminazione ──
  modaleEliminazioneAperto = false;
  piattoInEliminazione: PiattoDelGiornoDTO | null = null;
  isDeleting = false;

  // ── Modifica ──
  modaleModificaAperto = false;
  piattoInModifica: PiattoDelGiornoDTO | null = null;
  editNome = '';
  editDescrizione = '';
  editPrezzo: number | null = null;
  editMenuId: string | null = null;
  editAllergeniSelezionati: Set<string> = new Set();
  editNomeAllergeneCustom = '';
  isSavingEdit = false;
  editErrore: string | null = null;

  private prodottiMap: Map<string, ProdottoDTO> = new Map();

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
      this.allergeniDisponibili = (await firstValueFrom(this.http.get<AllergeneUI[]>('/api/allergenes'))) ?? [];
    } catch (err) {
      console.error('Errore allergeni:', err);
    }
  }

  async caricaMenus(): Promise<void> {
    try {
      const currentUser: AccountDTO = await firstValueFrom(this.http.get<AccountDTO>('/api/account'));
      const tutti: MenuDTO[] = (await firstValueFrom(this.http.get<MenuDTO[]>('/api/menus'))) ?? [];
      this.menus = tutti.filter(m => m.ristoratore?.login === currentUser.login);
    } catch (err) {
      console.error('Errore menu:', err);
    }
  }

  private async costruisciProdottiMap(): Promise<void> {
    try {
      const tuttiIProdotti: ProdottoDTO[][] = await Promise.all(
        this.menus.map(menu => firstValueFrom(this.http.get<ProdottoDTO[]>(`/api/menus/${menu.id}/prodotti-completi`)).then(r => r ?? [])),
      );
      tuttiIProdotti.flat().forEach(p => this.prodottiMap.set(String(p.id), p));
    } catch (err) {
      console.warn('Errore costruzione mappa prodotti:', err);
    }
  }

  async caricaPiattiGiorno(): Promise<void> {
    try {
      const piatti = (await firstValueFrom(this.http.get<PiattoDelGiornoDTO[]>('/api/piatto-del-giornos'))) ?? [];
      this.piattiGiorno = piatti.map(p => this.arricchisciPiatto(p));
    } catch (err) {
      console.error('Errore piatti del giorno:', err);
    } finally {
      this.isLoading = false;
    }
  }

  private arricchisciPiatto(piatto: PiattoDelGiornoDTO): PiattoDelGiornoDTO {
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

  private arricchisciAllergeni(lista: AllergeneDTO[]): AllergeneUI[] {
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

  getAllergeneById(id: string): AllergeneUI | undefined {
    return this.allergeniDisponibili.find(a => String(a.id) === String(id));
  }

  getAllergeniPiatto(piatto: PiattoDelGiornoDTO): AllergeneDTO[] {
    const lista: AllergeneDTO[] = piatto.prodotto?.allergenis ?? piatto.allergenis ?? [];
    return this.arricchisciAllergeni(lista);
  }

  getAllergeneIcona(a: AllergeneDTO): string {
    if (!a) return ALLERGENE_MANUALE_ICONA;
    const nomeKey = (a.nome ?? '').toLowerCase().trim();
    if (ALLERGENE_ICONE_MAP[nomeKey]) return ALLERGENI_ICONE_BASE + ALLERGENE_ICONE_MAP[nomeKey];
    if (a.icona && a.iconaContentType) return `data:${a.iconaContentType};base64,${a.icona}`;
    if (a.id != null) {
      const t = this.allergeniDisponibili.find(d => String(d.id) === String(a.id));
      if (t?.icona && t?.iconaContentType) return `data:${t.iconaContentType};base64,${t.icona}`;
    }
    if (a.nome) {
      const t = this.allergeniDisponibili.find(d => d.nome.toLowerCase().trim() === nomeKey);
      if (t?.icona && t?.iconaContentType) return `data:${t.iconaContentType};base64,${t.icona}`;
    }
    return ALLERGENE_MANUALE_ICONA;
  }

  // ══════════════════════════════════════════════════
  //  SELEZIONE MULTI-MENU
  // ══════════════════════════════════════════════════

  toggleMenuNuovoPiatto(id: string): void {
    if (this.menuNuovoPiattoIds.has(id)) this.menuNuovoPiattoIds.delete(id);
    else this.menuNuovoPiattoIds.add(id);
    this.menuNuovoPiattoIds = new Set(this.menuNuovoPiattoIds);
  }

  toggleMenuDestinazione(id: string): void {
    if (this.menuDestinazioneIds.has(id)) this.menuDestinazioneIds.delete(id);
    else this.menuDestinazioneIds.add(id);
    this.menuDestinazioneIds = new Set(this.menuDestinazioneIds);
  }

  // ══════════════════════════════════════════════════
  //  RAGGRUPPAMENTO CARD PER PRODOTTO
  // ══════════════════════════════════════════════════

  /** Restituisce true se almeno un entry del gruppo è attivo */
  gruppoHaAttivo(gruppo: PiattoGruppo): boolean {
    for (const entry of gruppo.entries) {
      if (entry.attivo) return true;
    }
    return false;
  }

  get piattiGruppo(): PiattoGruppo[] {
    const map = new Map<string, PiattoDelGiornoDTO[]>();
    for (const p of this.piattiGiorno) {
      // Prodotti "da menu" → raggruppati per prodotto.id
      // Prodotti personalizzati → raggruppati per nome + prezzo (stesso piatto su più menu)
      let key: string;
      if (p.prodotto?.id) {
        key = `prod_${p.prodotto.id}`;
      } else {
        const nome = (p.nome ?? '').trim().toLowerCase();
        const prezzo = String(p.prezzo ?? '');
        key = `custom_${nome}_${prezzo}`;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).map(([key, entries]) => {
      const first = entries[0];
      return {
        key,
        entries,
        isFromMenu: !!first.prodotto,
        isMulti: entries.length > 1,
        nome: this.nomePiatto(first),
        descrizione: this.descrizionePiatto(first),
        prezzo: this.prezzoPiatto(first),
        allergeni: this.getAllergeniPiatto(first),
      };
    });
  }

  // ══════════════════════════════════════════════════
  //  ALLERGENI CUSTOM → PERSISTENZA NEL DB
  // ══════════════════════════════════════════════════

  private async assicuraAllergeniNelDb(idSet: Set<string>): Promise<{ id: string }[]> {
    const risultato: { id: string }[] = [];
    for (const id of idSet) {
      if (!id.startsWith('custom_')) {
        risultato.push({ id });
      } else {
        const locale = this.allergeniDisponibili.find(a => String(a.id) === id);
        if (!locale) continue;
        try {
          const creato: AllergeneUI = await firstValueFrom(
            this.http.post<AllergeneUI>('/api/allergenes', { nome: locale.nome, colore: locale.colore ?? '#607D8B' }),
          );
          const idx = this.allergeniDisponibili.findIndex(a => String(a.id) === id);
          if (idx !== -1) this.allergeniDisponibili[idx] = { ...this.allergeniDisponibili[idx], id: creato.id };
          risultato.push({ id: String(creato.id) });
        } catch (err) {
          console.error(`Errore creazione allergene custom "${locale.nome}":`, err);
        }
      }
    }
    return risultato;
  }

  // ══════════════════════════════════════════════════
  //  MODIFICA
  // ══════════════════════════════════════════════════

  apriModaleModifica(piatto: PiattoDelGiornoDTO): void {
    this.piattoInModifica = piatto;
    this.editErrore = null;
    this.editMenuId = piatto.menu?.id ?? null;
    if (piatto.prodotto) {
      this.editNome = piatto.prodotto.nome;
      this.editDescrizione = piatto.prodotto.descrizione ?? '';
      this.editPrezzo = piatto.prodotto.prezzo;
      this.editAllergeniSelezionati = new Set((piatto.prodotto.allergenis ?? []).map(a => String(a.id)));
    } else {
      this.editNome = piatto.nome ?? '';
      this.editDescrizione = piatto.descrizione ?? '';
      this.editPrezzo = piatto.prezzo ?? null;
      this.editAllergeniSelezionati = new Set((piatto.allergenis ?? []).map(a => String(a.id)));
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
    const custom: AllergeneUI = { id: idTemp, nome, icona: undefined, iconaContentType: undefined, colore: '#607D8B', isCustom: true };
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
      const allergeni = await this.assicuraAllergeniNelDb(this.editAllergeniSelezionati);
      const body: PiattoDelGiornoBody = {
        id: this.piattoInModifica.id,
        attivo: this.piattoInModifica.attivo,
        menu: { id: this.editMenuId! },
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
      await firstValueFrom(this.http.put(`/api/piatto-del-giornos/${this.piattoInModifica.id}`, body));
      const menuInfo = this.menus.find(m => m.id === this.editMenuId);
      this.piattiGiorno = this.piattiGiorno.map(p => {
        if (p.id !== this.piattoInModifica!.id) return p;
        const aggiornato: PiattoDelGiornoDTO = {
          ...p,
          menu: menuInfo ? { id: menuInfo.id, nome: menuInfo.nome } : { id: this.editMenuId! },
        };
        if (!p.prodotto) {
          aggiornato.nome = this.editNome.trim();
          aggiornato.descrizione = this.editDescrizione.trim() || undefined;
          aggiornato.prezzo = this.editPrezzo!;
          aggiornato.allergenis = allergeni.map(a => this.getAllergeneById(a.id)).filter((a): a is AllergeneUI => a !== undefined);
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

  apriModaleEliminazione(piatto: PiattoDelGiornoDTO): void {
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
      await firstValueFrom(this.http.delete(`/api/piatto-del-giornos/${this.piattoInEliminazione.id}`));
      this.piattiGiorno = this.piattiGiorno.filter(p => p.id !== this.piattoInEliminazione!.id);
      this.isDeleting = false;
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
      this.portate = (await firstValueFrom(this.http.get<PortataDTO[]>(`/api/menus/${this.menuSelezionato}/portatas`))) ?? [];
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
      const prods: ProdottoDTO[] =
        (await firstValueFrom(this.http.get<ProdottoDTO[]>(`/api/prodottos/by-portata/${this.portataSelezionata}`))) ?? [];
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
    this.menuNuovoPiattoIds = new Set();
    this.menuDestinazioneIds = new Set();
    this.step4DaMenuAttivo = false;
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
    if (this.modalitaSelezioneProdotto) {
      return this.prodottoSelezionato !== null && this.menuDestinazioneIds.size > 0;
    }
    return this.nome.trim() !== '' && this.prezzo !== null && this.prezzo > 0 && this.menuNuovoPiattoIds.size > 0;
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
    const custom: AllergeneUI = { id: idTemp, nome, icona: undefined, iconaContentType: undefined, colore: '#607D8B', isCustom: true };
    this.allergeniDisponibili = [...this.allergeniDisponibili, custom];
    this.allergeniSelezionati = new Set([...this.allergeniSelezionati, idTemp]);
    this.nomeAllergeneCustom = '';
  }

  /** Step 3 → Step 4: memorizza prodotto e mostra selezione menu destinazione */
  selezionaESalvaProdotto(prod: ProdottoDTO): void {
    this._prodottoDettaglio = prod;
    this.prodottoSelezionato = prod.id;
    this.menuDestinazioneIds = new Set();
    this.step4DaMenuAttivo = true;
  }

  /** Torna allo step 3 annullando la selezione menu */
  tornaAStep3(): void {
    this.step4DaMenuAttivo = false;
    this.prodottoSelezionato = null;
    this._prodottoDettaglio = null;
    this.menuDestinazioneIds = new Set();
  }

  async salvaPiatto(): Promise<void> {
    if (!this.formValido()) return;
    this.isSaving = true;
    this.successMessage = null;
    this.errorMessage = null;
    try {
      let allergeni: { id: string }[] = [];
      if (!this.modalitaSelezioneProdotto) {
        allergeni = await this.assicuraAllergeniNelDb(this.allergeniSelezionati);
      }

      const menuIds = this.modalitaSelezioneProdotto ? Array.from(this.menuDestinazioneIds) : Array.from(this.menuNuovoPiattoIds);

      const nuoviPiatti: PiattoDelGiornoDTO[] = [];

      for (const menuId of menuIds) {
        const body: PiattoDelGiornoBody = { attivo: true };
        if (this.modalitaSelezioneProdotto && this.prodottoSelezionato) {
          body.prodotto = { id: this.prodottoSelezionato };
          body.menu = { id: menuId };
          body.nome = null;
          body.descrizione = null;
          body.prezzo = null;
        } else {
          body.nome = this.nome.trim();
          body.descrizione = this.descrizione.trim() || null;
          body.prezzo = this.prezzo;
          body.prodotto = null;
          body.menu = { id: menuId };
          body.allergenis = allergeni;
        }

        const piattoRisposta: PiattoDelGiornoDTO = await firstValueFrom(
          this.http.post<PiattoDelGiornoDTO>('/api/piatto-del-giornos', body),
        );
        const menuInfo = this.menus.find(m => m.id === menuId);
        let piattoArricchito: PiattoDelGiornoDTO;

        if (this.modalitaSelezioneProdotto && this._prodottoDettaglio) {
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
          piattoArricchito = {
            ...piattoRisposta,
            attivo: true,
            menu: menuInfo ? { id: menuInfo.id, nome: menuInfo.nome } : piattoRisposta.menu,
            allergenis: allergeni.map(a => this.getAllergeneById(a.id)).filter((a): a is AllergeneUI => a !== undefined),
          };
        }
        nuoviPiatti.push(piattoArricchito);
      }

      this.piattiGiorno = [...nuoviPiatti, ...this.piattiGiorno];
      this.chiudiModale();
    } catch (err) {
      console.error('Errore salvataggio:', err);
      this.errorMessage = '❌ Errore durante il salvataggio. Riprova.';
    } finally {
      this.isSaving = false;
    }
  }

  async toggleAttivo(piatto: PiattoDelGiornoDTO): Promise<void> {
    if (!piatto.id) return;
    const nuovoStato = !piatto.attivo;
    piatto.attivo = nuovoStato;
    try {
      try {
        await firstValueFrom(this.http.patch(`/api/piatto-del-giornos/${piatto.id}`, { id: piatto.id, attivo: nuovoStato }));
      } catch {
        await firstValueFrom(this.http.put(`/api/piatto-del-giornos/${piatto.id}`, { ...piatto }));
      }
    } catch (err) {
      console.error('Errore toggle:', err);
      piatto.attivo = !nuovoStato;
    }
  }

  nomePiatto(p: PiattoDelGiornoDTO): string {
    return p.prodotto?.nome ?? p.nome ?? '';
  }
  descrizionePiatto(p: PiattoDelGiornoDTO): string | undefined {
    return p.prodotto?.descrizione ?? p.descrizione;
  }
  prezzoPiatto(p: PiattoDelGiornoDTO): number {
    return p.prodotto?.prezzo ?? p.prezzo ?? 0;
  }
  formatPrezzo(p: number): string {
    return `€ ${Number(p).toFixed(2).replace('.', ',')}`;
  }
  nomePortata(p: PortataDTO): string {
    if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) return p.nomePersonalizzato;
    return (p.nomeDefault ?? '').replace(/_/g, ' ');
  }
}
