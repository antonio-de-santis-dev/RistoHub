import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AccountDTO, AllergeneDTO, AllergeneUI, MenuDTO, PortataDTO, ProdottoDTO } from 'app/shared/model/risto.model';

// Percorso immagine fallback per allergeni senza icona (inseriti manualmente).
// Posizionare il file in: src/main/webapp/content/images/allergene-manuale.png
const ALLERGENE_MANUALE_ICONA = 'content/images/allergene-manuale.png';

@Component({
  selector: 'jhi-prodotto-add',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './prodotto-add.component.html',
  styleUrls: ['./prodotto-add.component.scss'],
})
export class ProdottoAddComponent implements OnInit {
  // ── Stato pagina ──────────────────────────────────
  isLoadingInit = true;
  isSaving = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  menuIdPerBack: string | null = null;

  // ── Selezione menu/portata ────────────────────────
  menus: MenuDTO[] = [];
  portate: PortataDTO[] = [];
  menuSelezionatoId: string | null = null;
  portataSelezionataId: string | null = null;
  portataPreimpostata = false;

  // ── Allergeni ─────────────────────────────────────
  allergeniDisponibili: AllergeneUI[] = [];
  allergeniSelezionati: Set<string> = new Set();
  nomeAllergeneCustom = '';

  // ── Campi form creazione ──────────────────────────
  nome = '';
  descrizione = '';
  prezzo: number | null = null;

  // ── Lista prodotti ────────────────────────────────
  prodottiAggiunti: ProdottoDTO[] = [];

  // ── Conferma eliminazione ─────────────────────────
  modaleEliminazioneAperto = false;
  prodottoInEliminazione: ProdottoDTO | null = null;
  isDeleting = false;

  // ── Modalità modifica ─────────────────────────────
  modalitaModifica = false;
  prodottoInModifica: ProdottoDTO | null = null;
  editNome = '';
  editDescrizione = '';
  editPrezzo: number | null = null;
  editAllergeniSelezionati: Set<string> = new Set();
  editNomeAllergeneCustom = '';
  isSavingEdit = false;
  editErrore: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const portataId = this.route.snapshot.paramMap.get('portataId');
    if (portataId) {
      this.portataSelezionataId = portataId;
      this.portataPreimpostata = true;
      this.caricaAllergeni();
      this.caricaProdottiEsistenti(portataId);
      this.caricaMenuIdDaPortata(portataId);
      this.isLoadingInit = false;
    } else {
      this.caricaMenus();
    }
  }

  async caricaMenuIdDaPortata(portataId: string): Promise<void> {
    try {
      const portata: PortataDTO = await firstValueFrom(this.http.get<PortataDTO>(`/api/portatas/${portataId}`));
      this.menuIdPerBack = portata?.menu?.id ?? null;
    } catch (err) {
      console.warn('Impossibile caricare portata per back-nav:', err);
    }
  }

  async caricaMenus(): Promise<void> {
    try {
      const currentUser: AccountDTO = await firstValueFrom(this.http.get<AccountDTO>('/api/account'));
      const tutti: MenuDTO[] = (await firstValueFrom(this.http.get<MenuDTO[]>('/api/menus'))) ?? [];
      this.menus = tutti.filter(m => m.ristoratore?.login === currentUser.login);
      await this.caricaAllergeni();
    } catch (err) {
      console.error('Errore caricamento menu:', err);
    } finally {
      this.isLoadingInit = false;
    }
  }

  tornaAlMenu(): void {
    if (this.menuIdPerBack) {
      this.router.navigate(['/menu-view', this.menuIdPerBack]);
    } else {
      this.router.navigate(['/menu-list']);
    }
  }

  async onMenuSelezionato(): Promise<void> {
    if (!this.menuSelezionatoId) return;
    this.portate = [];
    this.portataSelezionataId = null;
    try {
      this.portate = (await firstValueFrom(this.http.get<PortataDTO[]>(`/api/menus/${this.menuSelezionatoId}/portatas`))) ?? [];
    } catch (err) {
      console.error('Errore caricamento portate:', err);
    }
  }

  async onPortataSelezionata(): Promise<void> {
    if (!this.portataSelezionataId) return;
    this.prodottiAggiunti = [];
    this.annullaModifica();
    await this.caricaProdottiEsistenti(this.portataSelezionataId);
  }

  async caricaAllergeni(): Promise<void> {
    try {
      this.allergeniDisponibili = (await firstValueFrom(this.http.get<AllergeneUI[]>('/api/allergenes'))) ?? [];
    } catch (err) {
      console.error('Errore caricamento allergeni:', err);
    }
  }

  async caricaProdottiEsistenti(portataId: string): Promise<void> {
    try {
      const prodotti: ProdottoDTO[] = (await firstValueFrom(this.http.get<ProdottoDTO[]>(`/api/prodottos/by-portata/${portataId}`))) ?? [];
      this.prodottiAggiunti = prodotti;
    } catch (err) {
      console.error('Errore caricamento prodotti:', err);
    }
  }

  // ══════════════════════════════════════════════════
  //  ICONA ALLERGENE
  // ══════════════════════════════════════════════════

  /**
   * Restituisce l'URL dell'icona di un allergene.
   * Per gli allergeni senza icona (inseriti manualmente) usa l'immagine di fallback.
   */
  getAllergeneIcona(a: AllergeneDTO): string {
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
  //  Prima del salvataggio di qualsiasi prodotto, crea nel DB
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
          const creato = await firstValueFrom(
            this.http.post<AllergeneUI>('/api/allergenes', {
              nome: locale.nome,
              colore: locale.colore ?? '#607D8B',
            }),
          );
          // Aggiorna l'ID temporaneo con quello reale nell'elenco locale
          const idx = this.allergeniDisponibili.findIndex(a => String(a.id) === id);
          if (idx !== -1) {
            this.allergeniDisponibili[idx] = { ...this.allergeniDisponibili[idx], id: String(creato.id) };
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
  //  ALLERGENI — Creazione
  // ══════════════════════════════════════════════════

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
    const custom: AllergeneUI = { id: idTemp, nome, icona: undefined, iconaContentType: undefined, colore: '#607D8B', isCustom: true };
    this.allergeniDisponibili = [...this.allergeniDisponibili, custom];
    this.allergeniSelezionati = new Set([...this.allergeniSelezionati, idTemp]);
    this.nomeAllergeneCustom = '';
  }

  get allergeniSelezionatiArray(): string[] {
    return Array.from(this.allergeniSelezionati);
  }

  getAllergeneById(id: string): AllergeneUI | undefined {
    return this.allergeniDisponibili.find(a => String(a.id) === String(id));
  }

  // ══════════════════════════════════════════════════
  //  ALLERGENI — Modifica
  // ══════════════════════════════════════════════════

  toggleEditAllergene(id: string): void {
    if (this.editAllergeniSelezionati.has(id)) {
      this.editAllergeniSelezionati.delete(id);
    } else {
      this.editAllergeniSelezionati.add(id);
    }
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

  // ══════════════════════════════════════════════════
  //  MODIFICA PRODOTTO
  // ══════════════════════════════════════════════════

  avviaModifica(prodotto: ProdottoDTO): void {
    this.prodottoInModifica = prodotto;
    this.modalitaModifica = true;
    this.editErrore = null;

    this.editNome = prodotto.nome ?? '';
    this.editDescrizione = prodotto.descrizione ?? '';
    this.editPrezzo = prodotto.prezzo ?? null;

    const ids = (prodotto.allergenis ?? []).map(a => String(a.id));
    this.editAllergeniSelezionati = new Set(ids);
    this.editNomeAllergeneCustom = '';

    setTimeout(() => {
      document.querySelector('.pa-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  annullaModifica(): void {
    this.modalitaModifica = false;
    this.prodottoInModifica = null;
    this.editNome = '';
    this.editDescrizione = '';
    this.editPrezzo = null;
    this.editAllergeniSelezionati = new Set();
    this.editNomeAllergeneCustom = '';
    this.editErrore = null;
  }

  editFormValido(): boolean {
    return this.editNome.trim() !== '' && this.editPrezzo !== null && this.editPrezzo > 0;
  }

  async salvaModifica(): Promise<void> {
    if (!this.prodottoInModifica?.id || !this.editFormValido()) return;
    this.isSavingEdit = true;
    this.editErrore = null;

    try {
      // ✅ Crea nel DB gli eventuali allergeni custom prima del salvataggio
      const allergeni = await this.assicuraAllergeniNelDb(this.editAllergeniSelezionati);

      const body = {
        id: this.prodottoInModifica.id,
        nome: this.editNome.trim(),
        descrizione: this.editDescrizione.trim() || undefined,
        prezzo: this.editPrezzo,
        portata: { id: this.portataSelezionataId },
        allergenis: allergeni,
      };

      await firstValueFrom(this.http.put(`/api/prodottos/${this.prodottoInModifica.id}`, body));

      this.prodottiAggiunti = this.prodottiAggiunti.map((p): ProdottoDTO => {
        if (p.id !== this.prodottoInModifica!.id) return p;
        return {
          ...p,
          nome: this.editNome.trim(),
          descrizione: this.editDescrizione.trim() || undefined,
          prezzo: this.editPrezzo ?? 0,
          // ✅ IDs reali post-creazione allergeni
          allergenis: allergeni.map(a => this.getAllergeneById(a.id)).filter((a): a is AllergeneDTO => a !== undefined),
        };
      });

      this.isSavingEdit = false;
      this.annullaModifica();
    } catch (err) {
      console.error('Errore modifica:', err);
      this.editErrore = '❌ Errore durante il salvataggio. Riprova.';
      this.isSavingEdit = false;
    }
  }

  // ══════════════════════════════════════════════════
  //  ELIMINAZIONE
  // ══════════════════════════════════════════════════

  apriConfermaEliminazione(prodotto: ProdottoDTO): void {
    this.prodottoInEliminazione = prodotto;
    this.modaleEliminazioneAperto = true;
  }

  chiudiConfermaEliminazione(): void {
    if (this.isDeleting) return;
    this.prodottoInEliminazione = null;
    this.modaleEliminazioneAperto = false;
  }

  async confermaEliminazione(): Promise<void> {
    if (!this.prodottoInEliminazione?.id) return;
    this.isDeleting = true;
    try {
      await firstValueFrom(this.http.delete(`/api/prodottos/${this.prodottoInEliminazione.id}`));
      if (this.prodottoInModifica?.id === this.prodottoInEliminazione.id) {
        this.annullaModifica();
      }
      this.prodottiAggiunti = this.prodottiAggiunti.filter(p => p.id !== this.prodottoInEliminazione!.id);
      this.isDeleting = false; // ✅ reset PRIMA di chiudere
      this.chiudiConfermaEliminazione();
    } catch (err) {
      console.error('Errore eliminazione:', err);
      this.isDeleting = false;
    }
  }

  // ══════════════════════════════════════════════════
  //  CREAZIONE
  // ══════════════════════════════════════════════════

  nomePortata(p: PortataDTO): string {
    if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) return p.nomePersonalizzato;
    return (p.nomeDefault ?? '').replace(/_/g, ' ');
  }

  resetForm(): void {
    this.nome = '';
    this.descrizione = '';
    this.prezzo = null;
    this.allergeniSelezionati = new Set();
    this.successMessage = null;
    this.errorMessage = null;
  }

  formValido(): boolean {
    return this.nome.trim() !== '' && this.prezzo !== null && this.prezzo > 0 && this.portataSelezionataId !== null;
  }

  async aggiungiProdotto(): Promise<void> {
    if (!this.formValido()) return;
    this.isSaving = true;
    this.successMessage = null;
    this.errorMessage = null;

    try {
      // ✅ Crea nel DB gli eventuali allergeni custom prima del salvataggio
      const allergeni = await this.assicuraAllergeniNelDb(this.allergeniSelezionati);

      const prodotto = await firstValueFrom(
        this.http.post<ProdottoDTO>('/api/prodottos', {
          nome: this.nome.trim(),
          descrizione: this.descrizione.trim() || null,
          prezzo: this.prezzo,
          portata: { id: this.portataSelezionataId },
          allergenis: allergeni,
        }),
      );

      // ✅ IDs reali post-creazione allergeni
      prodotto.allergenis = allergeni.map(a => this.getAllergeneById(a.id)).filter((a): a is AllergeneUI => a !== undefined);
      this.prodottiAggiunti.unshift(prodotto);
      this.successMessage = `✅ "${prodotto.nome}" aggiunto con successo!`;
      this.resetForm();
    } catch (err) {
      console.error('Errore aggiunta prodotto:', err);
      this.errorMessage = '❌ Errore durante il salvataggio. Riprova.';
    } finally {
      this.isSaving = false;
    }
  }

  formatPrezzo(p: number): string {
    return `€ ${Number(p).toFixed(2).replace('.', ',')}`;
  }
}
