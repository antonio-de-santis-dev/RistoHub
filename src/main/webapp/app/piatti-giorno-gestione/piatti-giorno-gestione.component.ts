import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PiattoDelGiornoDTO, MenuDTO, ProdottoDTO, AllergeneDTO, AllergeneUI, AccountDTO } from '../shared/model/risto.model';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-piatti-giorno-gestione',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './piatti-giorno-gestione.component.html',
  styleUrls: ['./piatti-giorno-gestione.component.scss'],
})
export class PiattiGiornoGestioneComponent implements OnInit {
  piatti: PiattoDelGiornoDTO[] = [];
  menus: MenuDTO[] = [];
  prodotti: ProdottoDTO[] = [];
  allergeniDisponibili: AllergeneDTO[] = [];
  allergeniSelezionati: AllergeneDTO[] = [];
  currentUser?: { login?: string };

  // Form fields
  editMenuId: string | null = null;
  editNome: string = '';
  editDescrizione: string = '';
  editPrezzo: number | null = null;
  editProdottoId: string | null = null;
  piattoInModifica?: PiattoDelGiornoDTO;
  piattoInEliminazione?: PiattoDelGiornoDTO;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadData();
    this.currentUser = this.authService.getCurrentUser();
  }

  loadData(): void {
    // Esempio: Carica dati dal backend (sostituisci con chiamate API reali)
    this.menus = [
      {
        id: 1,
        nome: 'Menu Estate',
        ristoratore: { login: 'admin' },
        portate: [],
      },
      {
        id: 2,
        nome: 'Menu Inverno',
        ristoratore: { login: 'admin' },
        portate: [],
      },
    ];

    this.prodotti = [
      { id: 1, nome: 'Pasta al pomodoro', prezzo: 10.5, descrizione: 'Pasta con salsa di pomodoro fresco' },
      { id: 2, nome: 'Risotto ai funghi', prezzo: 12.0, descrizione: 'Risotto con funghi porcini' },
    ];

    this.allergeniDisponibili = [
      { id: 1, nome: 'Glutine', icona: '🌾', colore: '#FFD700' },
      { id: 2, nome: 'Latte', icona: '🥛', colore: '#F5F5DC' },
    ];

    this.piatti = [
      {
        id: 1,
        nome: 'Piatto del Giorno 1',
        descrizione: 'Descrizione piatto 1',
        prezzo: 15.0,
        menu: this.menus[0],
        prodotto: this.prodotti[0],
      },
    ];

    // Filtra i menu per l'utente corrente
    if (this.currentUser?.login) {
      this.menus = this.menus.filter(m => m.ristoratore?.login === this.currentUser?.login);
    }
  }

  // Corretto: Gestisce menu undefined
  getMenuNome(piatto: PiattoDelGiornoDTO): string {
    return piatto.menu?.nome ?? piatto.prodotto?.nome ?? 'Sconosciuto';
  }

  // Corretto: Crea un AllergeneUI senza isCustom (se non supportato)
  createCustomAllergene(nome: string): AllergeneUI {
    const idTemp = `custom-${Date.now()}`;
    return {
      id: idTemp,
      nome,
      icona: undefined,
      iconaContentType: undefined,
      colore: '#607D8B',
    };
  }

  // Corretto: Gestisce d.nome undefined
  findAllergeneByNome(nomeKey: string): AllergeneDTO | undefined {
    const nomeLower = nomeKey.toLowerCase().trim();
    return this.allergeniDisponibili.find(d => d.nome?.toLowerCase().trim() === nomeLower);
  }

  // Corretto: Gestisce a.nome undefined
  matchAllergene(a: AllergeneDTO | AllergeneUI): boolean {
    if (!this.piattoInModifica) return false;
    return this.piattoInModifica.prodotto?.allergene?.some(al => al.id === a.id) ?? false;
  }

  // Corretto: Gestisce piatto.menu
  prepareEdit(piatto: PiattoDelGiornoDTO): void {
    this.piattoInModifica = piatto;
    this.editMenuId = piatto.menu?.id?.toString() ?? null;
    this.editNome = piatto.nome ?? '';
    this.editDescrizione = piatto.descrizione ?? '';
    this.editPrezzo = piatto.prezzo ?? null;
    this.editProdottoId = piatto.prodotto?.id?.toString() ?? null;
    this.allergeniSelezionati = piatto.prodotto?.allergene ?? [];
  }

  // Corretto: Gestisce null vs undefined
  savePiatto(): void {
    if (!this.piattoInModifica) return;

    const aggiornato: PiattoDelGiornoDTO = {
      ...this.piattoInModifica,
      menu: this.editMenuId ? { id: parseInt(this.editMenuId) } : undefined,
      nome: this.editNome.trim(),
      descrizione: this.editDescrizione.trim() || undefined,
      prezzo: this.editPrezzo ?? undefined,
      prodotto: this.editProdottoId ? { id: parseInt(this.editProdottoId) } : undefined,
    };

    // Logica per salvare il piatto (da implementare)
    console.log('Piatto salvato:', aggiornato);
    this.resetForm();
  }

  // Corretto: Gestisce null vs undefined
  resetForm(): void {
    this.piattoInModifica = undefined;
    this.editMenuId = null;
    this.editNome = '';
    this.editDescrizione = '';
    this.editPrezzo = null;
    this.editProdottoId = null;
    this.allergeniSelezionati = [];
  }

  // Corretto: Gestisce piatto.menu
  prepareDelete(piatto: PiattoDelGiornoDTO): void {
    this.piattoInEliminazione = piatto;
  }

  // Corretto: Gestisce piatto.menu?.nome
  confirmDelete(): void {
    if (!this.piattoInEliminazione) return;
    // Logica per eliminare il piatto (da implementare)
    console.log('Piatto eliminato:', this.piattoInEliminazione);
    this.piatti = this.piatti.filter(p => p.id !== this.piattoInEliminazione?.id);
    this.piattoInEliminazione = undefined;
  }

  // Corretto: Gestisce p.nome, p.descrizione, p.prezzo
  getNomePiatto(p: PiattoDelGiornoDTO): string {
    return p.prodotto?.nome ?? p.nome ?? '';
  }

  getDescrizionePiatto(p: PiattoDelGiornoDTO): string {
    return p.prodotto?.descrizione ?? p.descrizione ?? '';
  }

  getPrezzoPiatto(p: PiattoDelGiornoDTO): number {
    return p.prodotto?.prezzo ?? p.prezzo ?? 0;
  }
}
