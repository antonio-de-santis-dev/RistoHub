import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl, SafeHtml } from '@angular/platform-browser';

// ── COSTANTE PER L'IMMAGINE DEGLI ALLERGENI PERSONALIZZATI ──
const ALLERGENE_MANUALE_ICONA = '/content/images/allergene-manuale.png';

interface Allergene {
  id: string;
  nome: string;
  icona?: string;
  iconaContentType?: string;
  colore?: string;
}

interface Prodotto {
  id: string;
  nome: string;
  descrizione?: string;
  prezzo: number;
  allergenis?: Allergene[];
  portata?: { id: string };
}

interface Portata {
  id: string;
  tipo: string;
  nomeDefault?: string;
  nomePersonalizzato?: string;
  prodotti?: Prodotto[];
  aperta?: boolean;
}

interface Menu {
  id: string;
  nome: string;
  descrizione?: string;
  colorePrimario?: string;
  coloreSecondario?: string;
  fontMenu?: string;
  templateStyle?: string;
}

// ─── Contatti ─────────────────────────────────────────────────────────────

interface ContattoItem {
  id: string;
  tipo: 'TELEFONO' | 'EMAIL' | 'SOCIAL' | 'INDIRIZZO';
  valore: string;
  reteSociale?: string;
  etichetta?: string;
  ordine: number;
}

interface ListaContatti {
  id: string;
  nome: string;
  items: ContattoItem[];
}

const SOCIAL_ICONS_SVG: Record<string, string> = {
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

interface Lingua {
  codice: string;
  nome: string;
  bandiera: string; // emoji fallback
  svgBandiera: string; // SVG inline
}

@Component({
  selector: 'jhi-menu-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './menu-view.component.html',
  styleUrls: ['./menu-view.component.scss'],
})
export class MenuViewComponent implements OnInit {
  menu: Menu | null = null;
  portate: Portata[] = [];
  logoUrl: SafeUrl | null = null;
  isLoading = true;
  errore = false;
  piattiDelGiorno: any[] = [];
  piattiGiornoAperti = false;

  // ── Contatti ──────────────────────────────────────────────────
  listeContatti: ListaContatti[] = [];

  allergeniMap: Map<string, Allergene> = new Map();
  private allergeniByNome: Map<string, Allergene> = new Map();
  private prodottiMap: Map<string, Prodotto> = new Map();

  // ── Modifica prodotto ──
  prodottoInModifica: Prodotto | null = null;
  editNome = '';
  editDescrizione = '';
  editPrezzo: number | null = null;
  editAllergeniSelezionati: Set<string> = new Set();
  allergeniDisponibili: Allergene[] = [];
  isSavingEdit = false;
  editErrore: string | null = null;

  // ── Conferma eliminazione ──
  prodottoInEliminazione: Prodotto | null = null;
  isDeleting = false;

  // ══════════════════════════════════════════════════
  //  SISTEMA MULTILINGUA
  // ══════════════════════════════════════════════════

  readonly LINGUE: Lingua[] = [
    {
      codice: 'it',
      nome: 'Italiano',
      bandiera: '🇮🇹',
      svgBandiera: `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mIT" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30"><path d="M0 15C0 6.71573 6.71573 0 15 0C23.2843 0 30 6.71573 30 15C30 23.2843 23.2843 30 15 30C6.71573 30 0 23.2843 0 15Z" fill="white"/></mask><g mask="url(#mIT)"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.625 0H30V30H20.625V0Z" fill="#C51918"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H11.25V30H0V0Z" fill="#5EAA22"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.375 0H20.625V30H9.375V0Z" fill="white"/></g></svg>`,
    },
    {
      codice: 'en',
      nome: 'English',
      bandiera: '🇬🇧',
      svgBandiera: `<svg width=\"30\" height=\"30\" viewBox=\"0 0 60 60\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><mask id=\"mEN\" style=\"mask-type:luminance\" maskUnits=\"userSpaceOnUse\" x=\"0\" y=\"0\" width=\"60\" height=\"60\"><circle cx=\"30\" cy=\"30\" r=\"30\" fill=\"white\"/></mask><g mask=\"url(#mEN)\"><rect width=\"60\" height=\"60\" fill=\"#012169\"/><path d=\"M0 0L60 60M60 0L0 60\" stroke=\"white\" stroke-width=\"12\"/><path d=\"M0 0L60 60M60 0L0 60\" stroke=\"#C8102E\" stroke-width=\"7.2\"/><path d=\"M30 0V60M0 30H60\" stroke=\"white\" stroke-width=\"20\"/><path d=\"M30 0V60M0 30H60\" stroke=\"#C8102E\" stroke-width=\"12\"/></g></svg>`,
    },
    {
      codice: 'fr',
      nome: 'Français',
      bandiera: '🇫🇷',
      svgBandiera: `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mFR" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30"><path d="M0 15C0 6.71573 6.71573 0 15 0C23.2843 0 30 6.71573 30 15C30 23.2843 23.2843 30 15 30C6.71573 30 0 23.2843 0 15Z" fill="white"/></mask><g mask="url(#mFR)"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.625 0H30V30H20.625V0Z" fill="#F50100"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H11.25V30H0V0Z" fill="#2E42A5"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.375 0H20.625V30H9.375V0Z" fill="#F7FCFF"/></g></svg>`,
    },
    {
      codice: 'de',
      nome: 'Deutsch',
      bandiera: '🇩🇪',
      svgBandiera: `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mDE" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30"><path d="M0 15C0 6.71573 6.71573 0 15 0C23.2843 0 30 6.71573 30 15C30 23.2843 23.2843 30 15 30C6.71573 30 0 23.2843 0 15Z" fill="white"/></mask><g mask="url(#mDE)"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 20H30V30H0V20Z" fill="#FFD018"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 10H30V20H0V10Z" fill="#E31D1C"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H30V10H0V0Z" fill="#272727"/></g></svg>`,
    },
    {
      codice: 'es',
      nome: 'Español',
      bandiera: '🇪🇸',
      svgBandiera: `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mES" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30"><path d="M0 15C0 6.71573 6.71573 0 15 0C23.2843 0 30 6.71573 30 15C30 23.2843 23.2843 30 15 30C6.71573 30 0 23.2843 0 15Z" fill="white"/></mask><g mask="url(#mES)"><rect width="30" height="30" fill="#AA151B"/><rect y="7.5" width="30" height="15" fill="#F1BF00"/></g></svg>`,
    },
  ];

  linguaCorrente = 'it';
  isTraducendo = false;
  mostraDropdownLingua = false;
  erroreTraduzioneVisible = false;

  // Cache traduzioni: lingua -> Map<originale, tradotto>
  private cacheTraduzioni = new Map<string, Map<string, string>>();

  // Traduzioni statiche per i nomi portate default
  private readonly NOMI_PORTATE: Record<string, Record<string, string>> = {
    ANTIPASTO: { it: 'ANTIPASTO', en: 'STARTER', fr: 'ENTRÉE', de: 'VORSPEISE', es: 'ENTRANTE' },
    PRIMO: { it: 'PRIMO', en: 'FIRST COURSE', fr: 'PREMIER PLAT', de: 'ERSTER GANG', es: 'PRIMER PLATO' },
    SECONDO: { it: 'SECONDO', en: 'MAIN COURSE', fr: 'PLAT PRINCIPAL', de: 'HAUPTGERICHT', es: 'PLATO PRINCIPAL' },
    CONTORNO: { it: 'CONTORNO', en: 'SIDE DISH', fr: 'ACCOMPAGNEMENT', de: 'BEILAGE', es: 'GUARNICIÓN' },
    DOLCE: { it: 'DOLCE', en: 'DESSERT', fr: 'DESSERT', de: 'DESSERT', es: 'POSTRE' },
    BEVANDA: { it: 'BEVANDA', en: 'DRINK', fr: 'BOISSON', de: 'GETRÄNK', es: 'BEBIDA' },
    BIRRA: { it: 'BIRRA', en: 'BEER', fr: 'BIÈRE', de: 'BIER', es: 'CERVEZA' },
    VINO_ROSSO: { it: 'VINO ROSSO', en: 'RED WINE', fr: 'VIN ROUGE', de: 'ROTWEIN', es: 'VINO TINTO' },
    VINO_BIANCO: { it: 'VINO BIANCO', en: 'WHITE WINE', fr: 'VIN BLANC', de: 'WEISSWEIN', es: 'VINO BLANCO' },
    VINO_ROSATO: { it: 'VINO ROSATO', en: 'ROSÉ WINE', fr: 'VIN ROSÉ', de: 'ROSÉ', es: 'VINO ROSADO' },
    DIGESTIVO: { it: 'DIGESTIVO', en: 'DIGESTIF', fr: 'DIGESTIF', de: 'DIGESTIF', es: 'DIGESTIVO' },
  };

  // Traduzioni statiche etichette UI
  private readonly UI_LABELS: Record<string, Record<string, string>> = {
    PIATTI_GIORNO: {
      it: '✨ PIATTI DEL GIORNO / FUORI MENU',
      en: "✨ TODAY'S SPECIALS / OFF-MENU",
      fr: '✨ PLATS DU JOUR / HORS MENU',
      de: '✨ TAGESGERICHTE / AUSSER DER KARTE',
      es: '✨ PLATOS DEL DÍA / FUERA DE CARTA',
    },
    PIATTI_GIORNO_SHORT: {
      it: '✨ Piatti del Giorno',
      en: "✨ Today's Specials",
      fr: '✨ Plats du Jour',
      de: '✨ Tagesgerichte',
      es: '✨ Platos del Día',
    },
    BADGE_SPECIALE: {
      it: '🌟 Speciale',
      en: '🌟 Special',
      fr: '🌟 Spécial',
      de: '🌟 Speziell',
      es: '🌟 Especial',
    },
    ALLERGENI_TITOLO: {
      it: 'Allergeni presenti in questo menu',
      en: 'Allergens in this menu',
      fr: 'Allergènes présents dans ce menu',
      de: 'Allergene in dieser Speisekarte',
      es: 'Alérgenos presentes en este menú',
    },
    ALLERGENI_NOTA: {
      it: 'Per ulteriori informazioni sugli allergeni rivolgiti al personale di sala.',
      en: 'For more information about allergens, please ask our staff.',
      fr: "Pour plus d'informations sur les allergènes, adressez-vous au personnel de salle.",
      de: 'Für weitere Informationen zu Allergenen wenden Sie sich bitte an das Servicepersonal.',
      es: 'Para más información sobre los alérgenos, consulte al personal de sala.',
    },
    MENU_NOTE: {
      it: 'Tutti i nostri piatti sono preparati con ingredienti freschi e di qualità.',
      en: 'All our dishes are prepared with fresh, quality ingredients.',
      fr: 'Tous nos plats sont préparés avec des ingrédients frais et de qualité.',
      de: 'Alle unsere Gerichte werden mit frischen, hochwertigen Zutaten zubereitet.',
      es: 'Todos nuestros platos se preparan con ingredientes frescos y de calidad.',
    },
    TORNA_HOME: {
      it: '‹ Torna al menu',
      en: '‹ Back to menu',
      fr: '‹ Retour au menu',
      de: '‹ Zurück zum Menü',
      es: '‹ Volver al menú',
    },
    AGGIUNGI_PIATTO: {
      it: '➕ Aggiungi piatto',
      en: '➕ Add dish',
      fr: '➕ Ajouter un plat',
      de: '➕ Gericht hinzufügen',
      es: '➕ Añadir plato',
    },
    NESSUN_PIATTO: {
      it: 'Nessun piatto ancora aggiunto in questa sezione.',
      en: 'No dishes added to this section yet.',
      fr: 'Aucun plat encore ajouté dans cette section.',
      de: 'Noch keine Gerichte in diesem Abschnitt hinzugefügt.',
      es: 'Aún no se han añadido platos en esta sección.',
    },
    TORNA_FOTO: {
      it: 'Torna alle foto',
      en: 'Back to photos',
      fr: 'Retour aux photos',
      de: 'Zurück zu den Fotos',
      es: 'Volver a las fotos',
    },
    SELEZIONA_PORTATA: {
      it: 'Seleziona una portata per scoprire i nostri piatti',
      en: 'Select a course to discover our dishes',
      fr: 'Sélectionnez un plat pour découvrir notre carte',
      de: 'Wählen Sie einen Gang, um unsere Gerichte zu entdecken',
      es: 'Seleccione un plato para descubrir nuestros platos',
    },
    PIATTI_PAROLA: {
      it: 'piatti',
      en: 'dishes',
      fr: 'plats',
      de: 'Gerichte',
      es: 'platos',
    },
  };

  // ── Getters di comodità ──
  get linguaAttuale(): Lingua {
    return this.LINGUE.find(l => l.codice === this.linguaCorrente) ?? this.LINGUE[0];
  }

  /** Restituisce testo dinamico tradotto (nome/descrizione prodotto) */
  getT(testo: string | undefined | null): string {
    if (!testo) return testo ?? '';
    if (this.linguaCorrente === 'it') return testo;
    return this.cacheTraduzioni.get(this.linguaCorrente)?.get(testo) ?? testo;
  }

  /** Restituisce etichetta UI statica tradotta */
  getUI(chiave: string): string {
    return this.UI_LABELS[chiave]?.[this.linguaCorrente] ?? this.UI_LABELS[chiave]?.['it'] ?? chiave;
  }

  /** Sanitizza SVG per uso con [innerHTML] */
  getSafeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  /** Chiude il dropdown se si clicca fuori */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.lingua-selettore')) {
      this.mostraDropdownLingua = false;
    }
  }

  async cambiaLingua(codice: string): Promise<void> {
    this.mostraDropdownLingua = false;
    if (codice === this.linguaCorrente) return;
    this.linguaCorrente = codice;

    if (codice === 'it') return; // Italiano = nessuna traduzione necessaria

    // Se già in cache, niente da fare
    if (this.cacheTraduzioni.has(codice)) return;

    // Raccolta di tutte le stringhe da tradurre
    const stringhe = new Set<string>();

    this.portate.forEach(p => {
      if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) {
        stringhe.add(p.nomePersonalizzato);
      }
      (p.prodotti ?? []).forEach(prod => {
        if (prod.nome) stringhe.add(prod.nome);
        if (prod.descrizione) stringhe.add(prod.descrizione);
      });
    });

    this.piattiDelGiorno.forEach(p => {
      const nome = p.prodotto?.nome ?? p.nome;
      const desc = p.prodotto?.descrizione ?? p.descrizione;
      if (nome) stringhe.add(nome);
      if (desc) stringhe.add(desc);
    });

    if (stringhe.size === 0) return;

    this.isTraducendo = true;
    this.erroreTraduzioneVisible = false;
    const nuovaCache = new Map<string, string>();
    const lista = Array.from(stringhe).filter(s => s.trim().length > 0);

    // Traduzione in batch paralleli (5 alla volta per rispettare rate-limit)
    const BATCH = 5;
    let errori = 0;

    for (let i = 0; i < lista.length; i += BATCH) {
      const batch = lista.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async testo => {
          try {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(testo)}&langpair=it|${codice}`;
            const resp = await fetch(url);
            if (!resp.ok) {
              errori++;
              return;
            }
            const data = await resp.json();
            const tradotto = data.responseData?.translatedText;
            // MyMemory restituisce responseStatus come stringa ("200"), non numero
            const statusOk = Number(data.responseStatus) === 200;
            if (tradotto && tradotto !== testo && statusOk) {
              nuovaCache.set(testo, tradotto);
            }
          } catch {
            errori++;
          }
        }),
      );
      // Piccola pausa tra batch per non inondare l'API
      if (i + BATCH < lista.length) {
        await new Promise(res => setTimeout(res, 120));
      }
    }

    this.cacheTraduzioni.set(codice, nuovaCache);
    this.isTraducendo = false;

    if (errori > 0 && nuovaCache.size === 0) {
      this.erroreTraduzioneVisible = true;
      setTimeout(() => (this.erroreTraduzioneVisible = false), 4000);
    }
  }

  // ══════════════════════════════════════════════════

  get backRoute(): string {
    return '/menus';
  }

  modernoTabAttiva: string | null = null;
  modernoPortataAttiva: Portata | null = null;
  modernoCarouselIndex = 0;
  modernoAutoplayTimer: any = null;
  modernoImmagini: string[] = []; // ← popolato dal DB (immagini COPERTINA visibili)

  rusticoTabAttiva: string | null = null;
  rusticoPortataAttiva: Portata | null = null;
  rusticoCarouselIndex = 0;
  rusticoAutoplayTimer: any = null;
  rusticoImmagini: string[] = []; // ← popolato dal DB (immagini COPERTINA visibili)

  private readonly ORDINE_PORTATE: Record<string, number> = {
    ANTIPASTO: 0,
    PRIMO: 1,
    SECONDO: 2,
    CONTORNO: 3,
    BEVANDA: 5,
    BIRRA: 6,
    VINO_ROSSO: 7,
    VINO_ROSATO: 8,
    VINO_BIANCO: 9,
    DOLCE: 10,
    DIGESTIVO: 11,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errore = true;
      this.isLoading = false;
      return;
    }
    this.caricaMenu(id);
  }

  tornaAiMieiMenu(): void {
    this.router.navigate(['/menu-list']);
  }

  async caricaMenu(id: string): Promise<void> {
    try {
      this.menu = (await this.http.get<Menu>(`/api/menus/${id}`).toPromise()) ?? null;

      if (this.menu?.fontMenu) {
        const fontName = this.menu.fontMenu.replace(/ /g, '+');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;700&display=swap`;
        document.head.appendChild(link);
      }
      if (this.menu?.templateStyle === 'MODERNO' || this.menu?.templateStyle === 'RUSTICO') {
        const linkFonts = document.createElement('link');
        linkFonts.rel = 'stylesheet';
        linkFonts.href =
          'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Cormorant+Garamond:wght@300;400;500&family=Jost:wght@300;400;500&display=swap';
        document.head.appendChild(linkFonts);
      }

      try {
        const tuttiAllergeni: Allergene[] = (await this.http.get<Allergene[]>('/api/allergenes').toPromise()) ?? [];
        this.allergeniDisponibili = tuttiAllergeni;
        this.allergeniMap = new Map(tuttiAllergeni.map(a => [String(a.id), a]));
        this.allergeniByNome = new Map(tuttiAllergeni.map(a => [a.nome.toLowerCase().trim(), a]));
      } catch (e) {
        console.warn('Allergeni non disponibili.', e);
      }

      const immagini: any[] = (await this.http.get<any[]>(`/api/menus/${id}/immagini`).toPromise()) ?? [];
      const logo = immagini.find(i => i.tipo === 'LOGO');
      if (logo?.immagine) {
        const blob = this.base64ToBlob(logo.immagine, logo.immagineContentType);
        this.logoUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
      }

      // ── Carosello: carica immagini COPERTINA visibili ordinate per 'ordine' ──
      const copertine = immagini
        .filter(i => i.tipo === 'COPERTINA' && i.visibile !== false)
        .sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0))
        .map(i => `data:${i.immagineContentType};base64,${i.immagine}`);
      this.modernoImmagini = copertine;
      this.rusticoImmagini = copertine;

      const portateRaw: any[] = (await this.http.get<any[]>(`/api/menus/${id}/portatas`).toPromise()) ?? [];
      const portateCaricate = await Promise.all(
        portateRaw.map(async p => {
          const prodotti: Prodotto[] = (await this.http.get<Prodotto[]>(`/api/prodottos/by-portata/${p.id}`).toPromise()) ?? [];
          prodotti.forEach(prod => this.prodottiMap.set(String(prod.id), prod));
          return { ...p, prodotti, aperta: false };
        }),
      );
      this.portate = this.ordinaPortate(portateCaricate);

      const piattiAttivi: any[] = (await this.http.get<any[]>(`/api/menus/${id}/piatti-del-giorno`).toPromise()) ?? [];
      this.piattiDelGiorno = piattiAttivi.map(p => this.arricchisciPiatto(p));

      if (this.menu?.templateStyle === 'MODERNO' && this.modernoImmagini.length > 0) this.avviaAutoplay();
      if (this.menu?.templateStyle === 'RUSTICO' && this.rusticoImmagini.length > 0) this.avviaAutoplayRustico();

      // ── Carica contatti associati al menu ──────────────────────
      try {
        this.listeContatti = (await this.http.get<ListaContatti[]>(`/api/lista-contattis/menu/${id}`).toPromise()) ?? [];
      } catch (e) {
        console.warn('Contatti non disponibili:', e);
        this.listeContatti = [];
      }
    } catch (err) {
      console.error('Errore caricamento menu:', err);
      this.errore = true;
    } finally {
      this.isLoading = false;
    }
  }

  // ── Helpers contatti ──────────────────────────────────────────

  getSocialIconSvg(reteSociale: string | undefined): string {
    if (!reteSociale || reteSociale === 'ALTRO') return '';
    return SOCIAL_ICONS_SVG[reteSociale] ?? '';
  }

  getSafeSocialSvg(reteSociale: string | undefined): SafeHtml {
    const svg = this.getSocialIconSvg(reteSociale);
    return svg ? this.sanitizer.bypassSecurityTrustHtml(svg) : '';
  }

  getContattoLink(item: ContattoItem): string | null {
    if (item.tipo === 'TELEFONO') return `tel:${item.valore}`;
    if (item.tipo === 'EMAIL') return `mailto:${item.valore}`;
    if (item.tipo === 'SOCIAL') {
      const v = item.valore.trim();
      return v.startsWith('http') ? v : `https://${v}`;
    }
    return null; // INDIRIZZO: nessun link
  }

  getContattoLabel(item: ContattoItem): string {
    if (item.tipo === 'SOCIAL') {
      // Se l'utente ha inserito un nome personalizzato, ha la priorità
      if (item.etichetta?.trim()) return item.etichetta.trim();
      // Altrimenti mostra il nome della rete sociale formattato
      if (item.reteSociale && item.reteSociale !== 'ALTRO') {
        const nome = item.reteSociale;
        return nome.charAt(0) + nome.slice(1).toLowerCase().replace('_', ' ');
      }
      // ALTRO senza etichetta: fallback al valore (URL)
      return item.valore;
    }
    return item.valore;
  }

  // ══════════════════════════════════════════════════
  //  MODIFICA PRODOTTO
  // ══════════════════════════════════════════════════

  apriModifica(prodotto: Prodotto): void {
    this.prodottoInModifica = prodotto;
    this.editNome = prodotto.nome;
    this.editDescrizione = prodotto.descrizione ?? '';
    this.editPrezzo = prodotto.prezzo;
    this.editAllergeniSelezionati = new Set((prodotto.allergenis ?? []).map(a => String(a.id)));
    this.editErrore = null;
  }

  chiudiModifica(): void {
    this.prodottoInModifica = null;
    this.editErrore = null;
  }

  toggleEditAllergene(id: string): void {
    if (this.editAllergeniSelezionati.has(id)) {
      this.editAllergeniSelezionati.delete(id);
    } else {
      this.editAllergeniSelezionati.add(id);
    }
    this.editAllergeniSelezionati = new Set(this.editAllergeniSelezionati);
  }

  async salvaModifica(): Promise<void> {
    if (!this.prodottoInModifica) return;
    if (!this.editNome.trim() || !this.editPrezzo || this.editPrezzo <= 0) {
      this.editErrore = 'Nome e prezzo sono obbligatori.';
      return;
    }
    this.isSavingEdit = true;
    this.editErrore = null;
    try {
      const allergenis = Array.from(this.editAllergeniSelezionati).map(id => ({ id }));
      const body = {
        id: this.prodottoInModifica.id,
        nome: this.editNome.trim(),
        descrizione: this.editDescrizione.trim() || null,
        prezzo: this.editPrezzo,
        portata: this.prodottoInModifica.portata ?? { id: this.trovaProdottoPortataId(this.prodottoInModifica.id) },
        allergenis,
      };
      const aggiornato: any = await this.http.put(`/api/prodottos/${this.prodottoInModifica.id}`, body).toPromise();

      aggiornato.allergenis = allergenis.map(a => this.allergeniMap.get(String(a.id))).filter(Boolean);
      this.portate = this.portate.map(portata => ({
        ...portata,
        prodotti: (portata.prodotti ?? []).map(p => (p.id === aggiornato.id ? { ...aggiornato } : p)),
      }));
      this.prodottiMap.set(String(aggiornato.id), aggiornato);
      // Invalida le cache di traduzione perché il testo è cambiato
      this.cacheTraduzioni.clear();
      this.chiudiModifica();
    } catch (err) {
      console.error('Errore modifica prodotto:', err);
      this.editErrore = 'Errore durante il salvataggio. Riprova.';
    } finally {
      this.isSavingEdit = false;
    }
  }

  // ══════════════════════════════════════════════════
  //  ELIMINAZIONE PRODOTTO
  // ══════════════════════════════════════════════════

  apriConfermaEliminazione(prodotto: Prodotto): void {
    this.prodottoInEliminazione = prodotto;
  }

  chiudiConfermaEliminazione(): void {
    this.prodottoInEliminazione = null;
  }

  async confermanEliminazione(): Promise<void> {
    if (!this.prodottoInEliminazione) return;
    this.isDeleting = true;
    try {
      await this.http.delete(`/api/prodottos/${this.prodottoInEliminazione.id}`).toPromise();
      const idEliminato = this.prodottoInEliminazione.id;
      this.portate = this.portate.map(portata => ({
        ...portata,
        prodotti: (portata.prodotti ?? []).filter(p => p.id !== idEliminato),
      }));
      this.prodottiMap.delete(String(idEliminato));
      this.chiudiConfermaEliminazione();
    } catch (err) {
      console.error('Errore eliminazione prodotto:', err);
    } finally {
      this.isDeleting = false;
    }
  }

  private trovaProdottoPortataId(prodottoId: string): string | null {
    for (const portata of this.portate) {
      if ((portata.prodotti ?? []).some(p => p.id === prodottoId)) {
        return portata.id;
      }
    }
    return null;
  }

  // ══════════════════════════════════════════════════
  //  METODI ESISTENTI
  // ══════════════════════════════════════════════════

  private arricchisciPiatto(piatto: any): any {
    if (piatto.prodotto?.id) {
      const prodottoCompleto = this.prodottiMap.get(String(piatto.prodotto.id));
      if (prodottoCompleto) {
        const allergeniArricchiti = (prodottoCompleto.allergenis ?? []).map(
          a => this.allergeniMap.get(String(a.id)) ?? this.allergeniByNome.get((a.nome ?? '').toLowerCase().trim()) ?? a,
        );
        return { ...piatto, prodotto: { ...prodottoCompleto, allergenis: allergeniArricchiti } };
      }
      if (piatto.prodotto.allergenis?.length) {
        const allergeniArricchiti = piatto.prodotto.allergenis.map(
          (a: any) => this.allergeniMap.get(String(a.id)) ?? this.allergeniByNome.get((a.nome ?? '').toLowerCase().trim()) ?? a,
        );
        return { ...piatto, prodotto: { ...piatto.prodotto, allergenis: allergeniArricchiti } };
      }
    }
    if (piatto.allergenis?.length) {
      return {
        ...piatto,
        allergenis: piatto.allergenis.map(
          (a: any) => this.allergeniMap.get(String(a.id)) ?? this.allergeniByNome.get((a.nome ?? '').toLowerCase().trim()) ?? a,
        ),
      };
    }
    return piatto;
  }

  private ordinaPortate(portate: Portata[]): Portata[] {
    return [...portate].sort((a, b) => {
      const ordA = a.tipo === 'PERSONALIZZATA' ? 4 : (this.ORDINE_PORTATE[a.nomeDefault ?? ''] ?? 99);
      const ordB = b.tipo === 'PERSONALIZZATA' ? 4 : (this.ORDINE_PORTATE[b.nomeDefault ?? ''] ?? 99);
      return ordA - ordB;
    });
  }

  togglePortata(portata: Portata): void {
    portata.aperta = !portata.aperta;
  }
  togglePiattiGiorno(): void {
    this.piattiGiornoAperti = !this.piattiGiornoAperti;
  }

  modernoApriPortata(portata: Portata): void {
    this.modernoTabAttiva = portata.id;
    this.modernoPortataAttiva = portata;
    this.fermaAutoplay();
  }
  modernoTornaHome(): void {
    this.modernoTabAttiva = null;
    this.modernoPortataAttiva = null;
    this.avviaAutoplay();
  }
  modernoGoToSlide(n: number): void {
    this.modernoCarouselIndex = (n + this.modernoImmagini.length) % this.modernoImmagini.length;
  }
  avviaAutoplay(): void {
    this.fermaAutoplay();
    this.modernoAutoplayTimer = setInterval(() => {
      this.modernoCarouselIndex = (this.modernoCarouselIndex + 1) % this.modernoImmagini.length;
    }, 3500);
  }
  fermaAutoplay(): void {
    if (this.modernoAutoplayTimer) {
      clearInterval(this.modernoAutoplayTimer);
      this.modernoAutoplayTimer = null;
    }
  }

  rusticoApriTab(tabId: string, portata: Portata | null): void {
    this.rusticoTabAttiva = tabId;
    this.rusticoPortataAttiva = portata;
    this.fermaAutoplayRustico();
  }
  rusticoTornaCarosello(): void {
    this.rusticoTabAttiva = null;
    this.rusticoPortataAttiva = null;
    this.avviaAutoplayRustico();
  }
  rusticoGoToSlide(n: number): void {
    this.rusticoCarouselIndex = (n + this.rusticoImmagini.length) % this.rusticoImmagini.length;
  }
  avviaAutoplayRustico(): void {
    this.fermaAutoplayRustico();
    this.rusticoAutoplayTimer = setInterval(() => {
      this.rusticoCarouselIndex = (this.rusticoCarouselIndex + 1) % this.rusticoImmagini.length;
    }, 3500);
  }
  fermaAutoplayRustico(): void {
    if (this.rusticoAutoplayTimer) {
      clearInterval(this.rusticoAutoplayTimer);
      this.rusticoAutoplayTimer = null;
    }
  }

  getAllergeneIcona(a: Allergene): string {
    if (!a) return '';
    if (a.icona && a.iconaContentType) return `data:${a.iconaContentType};base64,${a.icona}`;
    const completo = this.allergeniMap.get(String(a.id ?? '')) ?? this.allergeniByNome.get((a.nome ?? '').toLowerCase().trim());
    if (completo?.icona && completo?.iconaContentType) return `data:${completo.iconaContentType};base64,${completo.icona}`;
    return ALLERGENE_MANUALE_ICONA;
  }

  get tuttiAllergeniMenu(): Allergene[] {
    const map = new Map<string, Allergene>();
    this.portate.forEach(portata => {
      (portata.prodotti ?? []).forEach((p: Prodotto) => {
        (p.allergenis ?? []).forEach(a => {
          const key = String(a.id ?? a.nome ?? '');
          if (key) map.set(key, a);
        });
      });
    });
    this.piattiDelGiorno.forEach(piatto => {
      const lista: any[] = piatto.prodotto?.allergenis ?? piatto.allergenis ?? [];
      lista.forEach(a => {
        const key = String(a.id ?? a.nome ?? '');
        if (key) map.set(key, a);
      });
    });
    return Array.from(map.values());
  }

  nomePortata(p: Portata): string {
    if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) {
      return this.getT(p.nomePersonalizzato);
    }
    const chiave = p.nomeDefault ?? '';
    const trad = this.NOMI_PORTATE[chiave];
    if (trad) return trad[this.linguaCorrente] ?? chiave.replace(/_/g, ' ');
    return chiave.replace(/_/g, ' ');
  }

  formatPrezzo(p: number | undefined | null): string {
    if (p === undefined || p === null) return '—';
    return `€ ${Number(p).toFixed(2).replace('.', ',')}`;
  }

  get colorePrimario(): string {
    return this.menu?.colorePrimario ?? '#8b1a1a';
  }
  get coloreSecondario(): string {
    return this.menu?.coloreSecondario ?? '#e8c832';
  }
  get fontTesto(): string {
    return this.menu?.fontMenu ?? 'Playfair Display';
  }
  get isModerno(): boolean {
    return this.menu?.templateStyle === 'MODERNO';
  }
  get isRustico(): boolean {
    return this.menu?.templateStyle === 'RUSTICO';
  }

  private base64ToBlob(base64: string, type: string): Blob {
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type });
  }
}
