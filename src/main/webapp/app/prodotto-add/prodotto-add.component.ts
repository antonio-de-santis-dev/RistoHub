import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProdottoDTO, MenuDTO, PortataDTO, AllergeneDTO, AllergeneUI, AccountDTO } from '../shared/model/risto.model';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-prodotto-add',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prodotto-add.component.html',
  styleUrls: ['./prodotto-add.component.scss'],
})
export class ProdottoAddComponent implements OnInit {
  @Input() portata?: PortataDTO;
  @Input() menu?: MenuDTO;

  prodotti: ProdottoDTO[] = [];
  allergeniDisponibili: AllergeneDTO[] = [];
  allergeniSelezionati: AllergeneDTO[] = [];
  currentUser?: { login?: string };
  menus: MenuDTO[] = [];

  // Form fields
  nome: string = '';
  descrizione: string = '';
  prezzo: number = 0;
  categoria: string = '';
  menuIdPerBack?: number;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadData();
    this.currentUser = this.authService.getCurrentUser();
  }

  loadData(): void {
    // Esempio: Carica dati dal backend (sostituisci con chiamate API reali)
    this.allergeniDisponibili = [
      { id: 1, nome: 'Glutine', icona: '🌾', colore: '#FFD700' },
      { id: 2, nome: 'Latte', icona: '🥛', colore: '#F5F5DC' },
      { id: 3, nome: 'Uova', icona: '🥚', colore: '#FF4500' },
    ];

    this.menus = [
      {
        id: 1,
        nome: 'Menu Estate',
        ristoratore: { login: 'admin' },
        portate: [],
      },
    ];

    // Filtra i menu per l'utente corrente
    if (this.currentUser?.login) {
      this.menus = this.menus.filter(m => m.ristoratore?.login === this.currentUser?.login);
    }

    // Se c'è una portata, usa il suo menu
    if (this.portata?.menu) {
      this.menu = this.portata.menu;
      this.menuIdPerBack = this.portata.menu.id;
    }
  }

  // Corretto: Gestisce d.nome undefined
  findAllergeneByNome(nomeKey: string): AllergeneDTO | undefined {
    const nomeLower = nomeKey.toLowerCase().trim();
    return this.allergeniDisponibili.find(d => d.nome?.toLowerCase().trim() === nomeLower);
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

  // Corretto: Gestisce portata?.menu?.id
  saveProdotto(): void {
    const nuovoProdotto: ProdottoDTO = {
      nome: this.nome.trim(),
      descrizione: this.descrizione.trim(),
      prezzo: this.prezzo,
      categoria: this.categoria.trim(),
      allergene: this.allergeniSelezionati,
      menu: this.menu,
    };

    // Logica per salvare il prodotto (da implementare)
    console.log('Prodotto salvato:', nuovoProdotto);
    this.resetForm();
  }

  resetForm(): void {
    this.nome = '';
    this.descrizione = '';
    this.prezzo = 0;
    this.categoria = '';
    this.allergeniSelezionati = [];
  }

  toggleAllergene(allergene: AllergeneDTO): void {
    const index = this.allergeniSelezionati.findIndex(a => a.id === allergene.id);
    if (index === -1) {
      this.allergeniSelezionati.push(allergene);
    } else {
      this.allergeniSelezionati.splice(index, 1);
    }
  }
}
