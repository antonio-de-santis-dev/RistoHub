import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ListaContattiDTO,
  ContattoItemForm,
  ListaContattiForm,
  TipoContatto,
  ReteSociale,
  ContattoItemDTO,
} from '../shared/model/risto.model';

@Component({
  selector: 'app-contatti-gestione',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contatti-gestione.component.html',
  styleUrls: ['./contatti-gestione.component.scss'],
})
export class ContattiGestioneComponent implements OnInit {
  liste: ListaContattiDTO[] = [];
  form: ListaContattiForm = { nome: '', items: [], menuIds: [] };
  selectedLista?: ListaContattiDTO;

  ngOnInit(): void {
    this.loadListe();
  }

  loadListe(): void {
    // Esempio: Carica le liste dal backend (sostituisci con la chiamata API reale)
    this.liste = [
      {
        id: 1,
        nome: 'Contatti Ristorante',
        items: [
          {
            id: '1',
            tipo: 'EMAIL',
            valore: 'info@ristorante.it',
            etichetta: 'Email',
            reteSociale: undefined,
            ordine: 1,
          },
          {
            id: '2',
            tipo: 'TELEFONO',
            valore: '+39 123 456789',
            etichetta: 'Telefono',
            reteSociale: undefined,
            ordine: 2,
          },
          {
            id: '3',
            tipo: 'INDIRIZZO',
            valore: 'Via Roma 1, Milano',
            etichetta: 'Indirizzo',
            reteSociale: undefined,
            ordine: 3,
          },
          {
            id: '4',
            tipo: 'SITO_WEB',
            valore: 'https://ristorante.it',
            etichetta: 'Sito Web',
            reteSociale: undefined,
            ordine: 4,
          },
          {
            id: '5',
            tipo: 'RETE_SOCIALE',
            valore: 'ristorante_italia',
            etichetta: 'Instagram',
            reteSociale: 'INSTAGRAM',
            ordine: 5,
          },
        ],
        menuIds: ['1', '2'],
      },
    ];
  }

  selectLista(lista: ListaContattiDTO): void {
    this.selectedLista = lista;
    this.form = this.prepareForm(lista);
  }

  prepareForm(lista: ListaContattiDTO): ListaContattiForm {
    return {
      nome: lista.nome ?? '',
      items: (lista.items ?? []).map(it => ({
        id: it.id,
        tipo: it.tipo as TipoContatto,
        valore: it.valore ?? '',
        etichetta: it.etichetta,
        reteSociale: it.reteSociale as ReteSociale | undefined,
        ordine: it.ordine,
      })),
      menuIds: lista.menuIds ?? [],
    };
  }

  iconaTipo(tipo: TipoContatto, reteSociale?: ReteSociale): string {
    const icons: Record<TipoContatto, string> = {
      EMAIL: '✉️',
      TELEFONO: '📞',
      INDIRIZZO: '📍',
      SITO_WEB: '🌐',
      RETE_SOCIALE: reteSociale ? this.iconaReteSociale(reteSociale) : '🔗',
    };
    return icons[tipo] ?? '❓';
  }

  iconaReteSociale(rete: ReteSociale): string {
    const icons: Record<ReteSociale, string> = {
      FACEBOOK: '📘',
      INSTAGRAM: '📷',
      WHATSAPP: '💬',
      TELEGRAM: '📤',
      TIKTOK: '🎵',
      LINKEDIN: '💼',
    };
    return icons[rete] ?? '🔗';
  }

  getLabelItem(item: ContattoItemForm): string {
    return item.etichetta ?? this.getTipoLabel(item.tipo);
  }

  getTipoLabel(tipo: TipoContatto): string {
    const labels: Record<TipoContatto, string> = {
      EMAIL: 'Email',
      TELEFONO: 'Telefono',
      INDIRIZZO: 'Indirizzo',
      SITO_WEB: 'Sito Web',
      RETE_SOCIALE: 'Rete Sociale',
    };
    return labels[tipo] ?? tipo;
  }

  saveForm(): void {
    if (!this.selectedLista) return;
    // Logica per salvare il form (da implementare)
    console.log('Form salvato:', this.form);
  }
}
