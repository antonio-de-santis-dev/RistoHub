import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { ListaContattiDTO, MenuDTO } from 'app/shared/model/risto.model';

// ─── Tipi ──────────────────────────────────────────────────────────────────

export type TipoContatto = 'TELEFONO' | 'EMAIL' | 'SOCIAL' | 'INDIRIZZO';

export type ReteSociale =
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'X'
  | 'YOUTUBE'
  | 'TIKTOK'
  | 'TELEGRAM'
  | 'MESSENGER'
  | 'THREADS'
  | 'SNAPCHAT'
  | 'WHATSAPP'
  | 'GOOGLE'
  | 'TRIPADVISOR'
  | 'ALTRO';

interface ContattoItemForm {
  id?: string;
  tipo: TipoContatto;
  /**
   * Per TELEFONO/EMAIL/INDIRIZZO: valore diretto (numero, email, indirizzo).
   * Per SOCIAL: URL del profilo (es. https://instagram.com/mioprofilo).
   */
  valore: string;
  reteSociale?: ReteSociale;
  /**
   * Per SOCIAL: nome visualizzato nel menu (es. "Seguici su Instagram!").
   * Se vuoto, viene mostrato il nome della rete sociale.
   */
  etichetta?: string;
  ordine: number;
}

interface ListaContattiForm {
  id?: string;
  nome: string;
  menuIds: Set<string>;
  items: ContattoItemForm[];
}

// ─── SVG icone social ──────────────────────────────────────────────────────

export const SOCIAL_ICONS: Record<string, string> = {
  FACEBOOK: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  INSTAGRAM: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
  X: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  YOUTUBE: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  TIKTOK: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  TELEGRAM: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`,
  MESSENGER: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.1l3.131 3.26L19.752 8.1l-6.561 6.863z"/></svg>`,
  THREADS: `<svg viewBox="0 0 192 192" fill="currentColor"><path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-43.1-41.457-43.249h-.34c-14.986 0-27.449 6.396-35.12 18.05l13.74 9.418c5.73-8.695 14.724-10.548 21.38-10.548h.229c8.27.053 14.495 2.454 18.508 7.145 2.932 3.405 4.893 8.117 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.238 139.966 29.811 120.682 29.608 96c.203-24.682 5.63-43.966 16.133-57.317C57.017 24.432 74.268 17.118 97.077 16.95c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 9.992 15.812 12.768 26.067l16.137-4.304c-3.354-12.423-8.893-23.316-16.551-32.401C147.343 11.047 125.507 1.212 97.24 1L96.977 1C68.786 1.212 47.19 11.08 33.02 29.317 20.24 45.898 13.666 68.817 13.441 96v.026c.225 27.183 6.8 50.102 19.579 66.683C46.99 180.92 68.586 190.788 96.977 191h.263c25.578-.188 43.613-6.9 58.431-21.689 19.69-19.649 19.136-44.24 12.637-59.41-4.698-10.953-14.755-19.775-26.771-24.913zM95.917 140.77c-10.443.588-21.287-4.098-21.845-14.174-.418-7.821 5.562-16.558 23.778-17.6 2.081-.12 4.127-.177 6.139-.177 6.17 0 11.937.606 17.17 1.768-1.955 24.407-14.966 29.56-25.242 30.183z"/></svg>`,
  SNAPCHAT: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.478.692 1.404.504 3.794.417 5.585a.074.074 0 0 0 .04.074c.26.146 1.084.604 1.99.572.879-.03 1.528-.404 2.186-.714.268-.124.598.002.598.344 0 .198-.153.417-.437.634-.787.595-1.862 1.091-2.23 1.786-.052.096-.079.199-.079.302 0 .156.04.31.057.37.054.176.306.776.437 1.234.19.67.085 1.265-.255 1.745-.572.81-1.613 1.14-2.623 1.303-.214.034-.436.064-.658.094-.18.02-.298.13-.38.246-.256.36-.416 1.066-.47 1.476-.086.657-.427 1.282-.998 1.282-.114 0-.202-.025-.31-.079-.385-.19-1.092-.483-2.11-.483-.977 0-1.672.29-2.068.483-.11.054-.198.08-.312.08-.57 0-.912-.626-.997-1.283-.055-.41-.215-1.116-.471-1.476-.083-.116-.2-.226-.38-.246-.222-.03-.444-.06-.657-.094-1.01-.163-2.051-.493-2.623-1.303-.34-.48-.446-1.075-.256-1.745.13-.458.383-1.058.436-1.234.016-.06.057-.214.057-.37 0-.103-.026-.206-.079-.302-.367-.695-1.442-1.19-2.23-1.786-.284-.217-.437-.436-.437-.634 0-.342.33-.468.597-.344.66.31 1.308.684 2.186.714.907.032 1.73-.426 1.99-.572a.074.074 0 0 0 .04-.074c-.087-1.79-.274-4.18.418-5.585C7.859 1.07 11.215.793 12.206.793z"/></svg>`,
  WHATSAPP: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
  GOOGLE: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>`,
  TRIPADVISOR: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c1.92 0 3.72.504 5.28 1.392L19.2 3.6l-1.488 1.776C19.2 6.888 20.4 8.784 20.4 12c0 4.632-3.768 8.4-8.4 8.4S3.6 16.632 3.6 12c0-3.216 1.2-5.112 2.688-6.624L4.8 3.6l1.92 1.392A8.352 8.352 0 0 1 12 3.6zM7.2 12a4.8 4.8 0 1 0 9.6 0 4.8 4.8 0 0 0-9.6 0zm2.4 0a2.4 2.4 0 1 1 4.8 0 2.4 2.4 0 0 1-4.8 0z"/></svg>`,
};

@Component({
  selector: 'app-contatti-gestione',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contatti-gestione.component.html',
  styleUrls: ['./contatti-gestione.component.scss'],
})
export class ContattiGestioneComponent implements OnInit {
  // ── Dati ────────────────────────────────────────────────────────
  liste: ListaContattiDTO[] = [];
  menu: MenuDTO[] = [];
  isLoading = true;

  // ── Modal form ──────────────────────────────────────────────────
  modalAperta = false;
  isEdit = false;
  isSaving = false;
  erroreForm: string | null = null;

  form: ListaContattiForm = this.formVuoto();

  // ── Conferma eliminazione ───────────────────────────────────────
  listaInEliminazione: ListaContattiDTO | null = null;
  isDeleting = false;

  // ── Costanti ────────────────────────────────────────────────────
  readonly TIPI: TipoContatto[] = ['TELEFONO', 'EMAIL', 'SOCIAL', 'INDIRIZZO'];

  readonly RETI_SOCIALI: { value: ReteSociale; label: string }[] = [
    { value: 'FACEBOOK', label: 'Facebook' },
    { value: 'INSTAGRAM', label: 'Instagram' },
    { value: 'X', label: 'X (Twitter)' },
    { value: 'YOUTUBE', label: 'YouTube' },
    { value: 'TIKTOK', label: 'TikTok' },
    { value: 'TELEGRAM', label: 'Telegram' },
    { value: 'MESSENGER', label: 'Messenger' },
    { value: 'THREADS', label: 'Threads' },
    { value: 'SNAPCHAT', label: 'Snapchat' },
    { value: 'WHATSAPP', label: 'WhatsApp' },
    { value: 'GOOGLE', label: 'Google' },
    { value: 'TRIPADVISOR', label: 'Tripadvisor' },
    { value: 'ALTRO', label: 'Altro (senza icona)' },
  ];

  readonly SOCIAL_ICONS = SOCIAL_ICONS;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    Promise.all([this.caricaListe(), this.caricaMenu()]).finally(() => (this.isLoading = false));
  }

  // ── Caricamento ─────────────────────────────────────────────────

  async caricaListe(): Promise<void> {
    try {
      this.liste = (await firstValueFrom(this.http.get<ListaContattiDTO[]>('/api/lista-contattis'))) ?? [];
    } catch (e) {
      console.error('Errore caricamento liste:', e);
    }
  }

  async caricaMenu(): Promise<void> {
    try {
      this.menu = (await firstValueFrom(this.http.get<MenuDTO[]>('/api/menus'))) ?? [];
    } catch (e) {
      console.error('Errore caricamento menu:', e);
    }
  }

  // ── Modal crea / modifica ───────────────────────────────────────

  apriCrea(): void {
    this.form = this.formVuoto();
    this.isEdit = false;
    this.erroreForm = null;
    this.modalAperta = true;
  }

  apriModifica(lista: ListaContattiDTO): void {
    this.form = {
      id: lista.id,
      nome: lista.nome,
      menuIds: new Set<string>(lista.menuIds ?? []),
      items: (lista.items ?? []).map(it => ({ ...it, reteSociale: it.reteSociale as ReteSociale | undefined })),
    };
    this.isEdit = true;
    this.erroreForm = null;
    this.modalAperta = true;
  }

  chiudiModal(): void {
    this.modalAperta = false;
    this.erroreForm = null;
  }

  // ── Gestione menu chips ─────────────────────────────────────────

  toggleMenu(menuId: string): void {
    if (this.form.menuIds.has(menuId)) {
      this.form.menuIds.delete(menuId);
    } else {
      this.form.menuIds.add(menuId);
    }
  }

  // ── Gestione items ──────────────────────────────────────────────

  aggiungiItem(): void {
    this.form.items.push({ tipo: 'TELEFONO', valore: '', ordine: this.form.items.length });
  }

  rimuoviItem(i: number): void {
    this.form.items.splice(i, 1);
  }

  spostaItem(i: number, dir: -1 | 1): void {
    const j = i + dir;
    if (j < 0 || j >= this.form.items.length) return;
    [this.form.items[i], this.form.items[j]] = [this.form.items[j], this.form.items[i]];
  }

  onTipoChange(item: ContattoItemForm): void {
    if (item.tipo !== 'SOCIAL') {
      item.reteSociale = undefined;
      item.etichetta = undefined;
    }
  }

  onReteSocialeChange(item: ContattoItemForm): void {
    // Non azzera etichetta: viene riutilizzata come nome pubblico per tutti i social
  }

  // ── Placeholder intelligente per il campo valore ───────────────

  getPlaceholderValore(item: ContattoItemForm): string {
    switch (item.tipo) {
      case 'TELEFONO':
        return '+39 000 000 0000';
      case 'EMAIL':
        return 'info@ristorante.it';
      case 'INDIRIZZO':
        return 'Via Roma 1, 00100 Roma';
      case 'SOCIAL':
        return 'https://www.instagram.com/mioprofilo';
      default:
        return '';
    }
  }

  // ── Salva ───────────────────────────────────────────────────────

  async salva(): Promise<void> {
    if (!this.form.nome.trim()) {
      this.erroreForm = 'Il nome della lista è obbligatorio.';
      return;
    }
    for (const it of this.form.items) {
      if (!it.valore.trim()) {
        this.erroreForm = 'Tutti i campi devono avere un valore.';
        return;
      }
      if (it.tipo === 'SOCIAL' && !it.reteSociale) {
        this.erroreForm = 'Seleziona la rete sociale per ogni campo Social.';
        return;
      }
      if (it.tipo === 'SOCIAL' && it.reteSociale === 'ALTRO' && !it.etichetta?.trim()) {
        this.erroreForm = 'Inserisci un\'etichetta per il social "Altro".';
        return;
      }
      // Validazione URL per social
      if (it.tipo === 'SOCIAL' && it.valore.trim() && !it.valore.startsWith('http')) {
        this.erroreForm = "L'URL del profilo social deve iniziare con https://";
        return;
      }
    }
    this.erroreForm = null;
    this.isSaving = true;

    const payload = {
      id: this.form.id,
      nome: this.form.nome,
      menuIds: Array.from(this.form.menuIds),
      items: this.form.items,
    };

    try {
      if (this.isEdit && this.form.id) {
        await firstValueFrom(this.http.put(`/api/lista-contattis/${this.form.id}`, payload));
      } else {
        await firstValueFrom(this.http.post('/api/lista-contattis', payload));
      }
      await this.caricaListe();
      this.chiudiModal();
    } catch (e: unknown) {
      this.erroreForm = 'Errore durante il salvataggio. Riprova.';
      console.error(e);
    } finally {
      this.isSaving = false;
    }
  }

  // ── Elimina ─────────────────────────────────────────────────────

  apriEliminazione(lista: ListaContattiDTO): void {
    this.listaInEliminazione = lista;
  }

  chiudiEliminazione(): void {
    this.listaInEliminazione = null;
  }

  async confermaEliminazione(): Promise<void> {
    if (!this.listaInEliminazione) return;
    this.isDeleting = true;
    try {
      await firstValueFrom(this.http.delete(`/api/lista-contattis/${this.listaInEliminazione.id}`));
      this.liste = this.liste.filter(l => l.id !== this.listaInEliminazione!.id);
      this.chiudiEliminazione();
    } catch (e) {
      console.error(e);
    } finally {
      this.isDeleting = false;
    }
  }

  // ── Helper UI ───────────────────────────────────────────────────

  nomeTipo(t: TipoContatto): string {
    const map: Record<TipoContatto, string> = {
      TELEFONO: 'Telefono',
      EMAIL: 'Email',
      SOCIAL: 'Social Network',
      INDIRIZZO: 'Indirizzo',
    };
    return map[t] ?? t;
  }

  iconaTipo(tipo: TipoContatto, reteSociale?: string): SafeHtml {
    const socialSvg = (() => {
      if (reteSociale && SOCIAL_ICONS[reteSociale]) {
        return SOCIAL_ICONS[reteSociale].replace('fill="currentColor"', 'fill="rgba(255,255,255,0.9)"');
      }
      return `<svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"
                    stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"
                    stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
            </svg>`;
    })();
    const map: Record<TipoContatto, string> = {
      TELEFONO: `<svg viewBox="0 0 82 81" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25.5576 29.2934C30.6448 43.1713 35.9114 48.7085 49.3095 54.6062L43.5031 62.7608C28.1179 55.395 20.4548 42.9787 16.8457 33.2892L25.5576 29.2934Z" fill="rgba(255,255,255,0.9)"/>
        <path d="M29.8252 10.134C32.5454 10.1234 34.6138 12.3869 34.4283 14.95C34.1365 18.9834 34.4472 21.8935 35.2838 25.5006C35.7433 27.482 34.7037 29.4944 33.0517 30.7906C30.825 32.5377 29.1238 34.7638 27.7718 36.6801C25.8978 39.3362 19.4487 39.1454 18.0225 36.2518C15.0914 30.305 13.105 19.349 17.3853 11.9469C18.0576 10.7842 19.4113 10.1747 20.8141 10.1693L29.8252 10.134Z" fill="rgba(255,255,255,0.9)"/>
        <path d="M71.1177 54.1403C71.4561 51.5912 69.3254 49.3798 66.6089 49.2454C62.3339 49.0339 59.3123 48.3927 55.6212 47.1746C53.5936 46.5055 51.3532 47.2381 49.792 48.6311C47.6877 50.5087 45.1431 51.8359 42.9661 52.873C39.9487 54.3105 39.3737 60.3798 42.2439 62.065C48.1425 65.5282 59.4203 68.7081 67.716 65.5853C69.0191 65.0948 69.8226 63.8989 69.997 62.5845L71.1177 54.1403Z" fill="rgba(255,255,255,0.9)"/>
      </svg>`,
      EMAIL: `<svg viewBox="0 0 68 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M61.7615 0C63.799 0 65.6084 0.931992 66.7469 2.37355L33.6815 28.8338L0.910706 2.85405C2.00641 1.14245 3.98264 0 6.23853 0H61.7615ZM0 44.0476V7.54932L23.5139 26.1905L0.048472 44.7932C0.0164873 44.549 0 44.3001 0 44.0476ZM2.15049 48.544C3.24536 49.451 4.67475 50 6.23853 50H61.7615C63.1055 50 64.3504 49.5944 65.3688 48.9046L40.3825 28.9096L35.8892 32.5052C34.6185 33.5222 32.7672 33.5262 31.4915 32.5149L26.9306 28.8991L2.15049 48.544ZM43.7803 26.1905L67.8295 45.4356C67.941 44.9902 68 44.5255 68 44.0476V6.80894L43.7803 26.1905Z" fill="rgba(255,255,255,0.9)"/>
      </svg>`,
      SOCIAL: socialSvg,
      INDIRIZZO: `<svg viewBox="0 0 44 57" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="pin-hole">
            <path fill-rule="evenodd" d="M0 0 H44 V57 H0 Z M21.3801 30.5723C26.2403 30.5723 30.1804 26.4275 30.1804 21.3145C30.1804 16.2016 26.2403 12.0567 21.3801 12.0567C16.5198 12.0567 12.5797 16.2016 12.5797 21.3145C12.5797 26.4275 16.5198 30.5723 21.3801 30.5723Z"/>
          </clipPath>
        </defs>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M21.5848 56.1928C13.3275 47.1218 -0.716971 34.245 0.0285209 20.238C1.24818 8.85045 10.434 0 21.5848 0C32.7356 0 41.9215 8.85045 43.1412 20.238C43.6553 35.5322 30.9666 46.1149 21.5848 56.1928Z" fill="rgba(255,255,255,0.9)" clip-path="url(#pin-hole)"/>
      </svg>`,
    };
    const svg = map[tipo] ?? `<svg viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><circle cx="12" cy="12" r="10"/></svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  nomeMenu(id: string): string {
    return this.menu.find(m => m.id === id)?.nome ?? id;
  }

  menuSelezionati(lista: ListaContattiDTO): string {
    const ids: string[] = lista.menuIds ?? [];
    if (!ids.length) return 'Nessun menu';
    return ids.map(id => this.nomeMenu(id)).join(', ');
  }

  getLabelItem(it: { tipo: TipoContatto; reteSociale?: string; etichetta?: string; valore: string }): string {
    if (it.tipo === 'SOCIAL') {
      if (it.reteSociale === 'ALTRO') return it.etichetta || 'Altro';
      return this.RETI_SOCIALI.find(r => r.value === it.reteSociale)?.label ?? it.reteSociale ?? '';
    }
    return this.nomeTipo(it.tipo as TipoContatto);
  }

  private formVuoto(): ListaContattiForm {
    return { nome: '', menuIds: new Set(), items: [] };
  }

  trackByIdx(i: number): number {
    return i;
  }
}
