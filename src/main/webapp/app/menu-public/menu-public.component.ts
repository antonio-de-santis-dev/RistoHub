import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
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
  WHATSAPP: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
};

interface Lingua {
  codice: string;
  nome: string;
  svgBandiera: string;
}

@Component({
  selector: 'jhi-menu-public',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-public.component.html',
  styleUrls: ['./menu-public.component.scss'],
})
export class MenuPublicComponent implements OnInit {
  menu: Menu | null = null;
  portate: Portata[] = [];
  logoUrl: SafeUrl | null = null;
  isLoading = true;
  errore = false;
  piattiDelGiorno: any[] = [];
  piattiGiornoAperti = false;
  listeContatti: ListaContatti[] = [];

  allergeniMap: Map<string, Allergene> = new Map();
  private allergeniByNome: Map<string, Allergene> = new Map();
  private prodottiMap: Map<string, Prodotto> = new Map();

  // ══ MULTILINGUA ════════════════════════════════════════════
  readonly LINGUE: Lingua[] = [
    {
      codice: 'it',
      nome: 'Italiano',
      svgBandiera: `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mIT" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30"><path d="M0 15C0 6.71573 6.71573 0 15 0C23.2843 0 30 6.71573 30 15C30 23.2843 23.2843 30 15 30C6.71573 30 0 23.2843 0 15Z" fill="white"/></mask><g mask="url(#mIT)"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.625 0H30V30H20.625V0Z" fill="#C51918"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H11.25V30H0V0Z" fill="#5EAA22"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.375 0H20.625V30H9.375V0Z" fill="white"/></g></svg>`,
    },
    {
      codice: 'en',
      nome: 'English',
      svgBandiera: `<svg width="30" height="30" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mEN" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="60" height="60"><circle cx="30" cy="30" r="30" fill="white"/></mask><g mask="url(#mEN)"><rect width="60" height="60" fill="#012169"/><path d="M0 0L60 60M60 0L0 60" stroke="white" stroke-width="12"/><path d="M0 0L60 60M60 0L0 60" stroke="#C8102E" stroke-width="7.2"/><path d="M30 0V60M0 30H60" stroke="white" stroke-width="20"/><path d="M30 0V60M0 30H60" stroke="#C8102E" stroke-width="12"/></g></svg>`,
    },
    {
      codice: 'fr',
      nome: 'Français',
      svgBandiera: `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mFR" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30"><path d="M0 15C0 6.71573 6.71573 0 15 0C23.2843 0 30 6.71573 30 15C30 23.2843 23.2843 30 15 30C6.71573 30 0 23.2843 0 15Z" fill="white"/></mask><g mask="url(#mFR)"><path fill-rule="evenodd" clip-rule="evenodd" d="M20.625 0H30V30H20.625V0Z" fill="#F50100"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H11.25V30H0V0Z" fill="#2E42A5"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.375 0H20.625V30H9.375V0Z" fill="#F7FCFF"/></g></svg>`,
    },
    {
      codice: 'de',
      nome: 'Deutsch',
      svgBandiera: `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mDE" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30"><path d="M0 15C0 6.71573 6.71573 0 15 0C23.2843 0 30 6.71573 30 15C30 23.2843 23.2843 30 15 30C6.71573 30 0 23.2843 0 15Z" fill="white"/></mask><g mask="url(#mDE)"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 20H30V30H0V20Z" fill="#FFD018"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 10H30V20H0V10Z" fill="#E31D1C"/><path fill-rule="evenodd" clip-rule="evenodd" d="M0 0H30V10H0V0Z" fill="#272727"/></g></svg>`,
    },
    {
      codice: 'es',
      nome: 'Español',
      svgBandiera: `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mES" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30"><path d="M0 15C0 6.71573 6.71573 0 15 0C23.2843 0 30 6.71573 30 15C30 23.2843 23.2843 30 15 30C6.71573 30 0 23.2843 0 15Z" fill="white"/></mask><g mask="url(#mES)"><rect width="30" height="30" fill="#AA151B"/><rect y="7.5" width="30" height="15" fill="#F1BF00"/></g></svg>`,
    },
  ];

  linguaCorrente = 'it';
  isTraducendo = false;
  mostraDropdownLingua = false;
  erroreTraduzioneVisible = false;
  private cacheTraduzioni = new Map<string, Map<string, string>>();

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
    BADGE_SPECIALE: { it: '🌟 Speciale', en: '🌟 Special', fr: '🌟 Spécial', de: '🌟 Speziell', es: '🌟 Especial' },
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
    NESSUN_PIATTO: {
      it: 'Nessun piatto ancora aggiunto in questa sezione.',
      en: 'No dishes added to this section yet.',
      fr: 'Aucun plat encore ajouté dans cette section.',
      de: 'Noch keine Gerichte in diesem Abschnitt hinzugefügt.',
      es: 'Aún no se han añadido platos en esta sección.',
    },
    SELEZIONA_PORTATA: {
      it: 'Seleziona una portata per scoprire i nostri piatti',
      en: 'Select a course to discover our dishes',
      fr: 'Sélectionnez un plat pour découvrir notre carte',
      de: 'Wählen Sie einen Gang, um unsere Gerichte zu entdecken',
      es: 'Seleccione un plato para descubrir nuestros platos',
    },
    PIATTI_PAROLA: { it: 'piatti', en: 'dishes', fr: 'plats', de: 'Gerichte', es: 'platos' },
    TORNA_HOME: { it: '‹ Torna al menu', en: '‹ Back to menu', fr: '‹ Retour au menu', de: '‹ Zurück zum Menü', es: '‹ Volver al menú' },
    TORNA_FOTO: {
      it: 'Torna alle foto',
      en: 'Back to photos',
      fr: 'Retour aux photos',
      de: 'Zurück zu den Fotos',
      es: 'Volver a las fotos',
    },
  };

  // Template moderno / rustico
  modernoTabAttiva: string | null = null;
  modernoPortataAttiva: Portata | null = null;
  modernoCarouselIndex = 0;
  modernoAutoplayTimer: any = null;
  modernoImmagini: string[] = [];
  modernoImmaginiCaricate: boolean[] = [];

  rusticoTabAttiva: string | null = null;
  rusticoPortataAttiva: Portata | null = null;
  rusticoCarouselIndex = 0;
  rusticoAutoplayTimer: any = null;
  rusticoImmagini: string[] = [];
  rusticoImmaginiCaricate: boolean[] = [];

  private touchStartX = 0;
  private readonly SWIPE_THRESHOLD = 40;

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

  // ── Getters ─────────────────────────────────────────────────────
  get linguaAttuale(): Lingua {
    return this.LINGUE.find(l => l.codice === this.linguaCorrente) ?? this.LINGUE[0];
  }

  getT(testo: string | undefined | null): string {
    if (!testo) return testo ?? '';
    if (this.linguaCorrente === 'it') return testo;
    return this.cacheTraduzioni.get(this.linguaCorrente)?.get(testo) ?? testo;
  }

  getUI(chiave: string): string {
    return this.UI_LABELS[chiave]?.[this.linguaCorrente] ?? this.UI_LABELS[chiave]?.['it'] ?? chiave;
  }

  getSafeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

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
    if (codice === 'it') return;
    if (this.cacheTraduzioni.has(codice)) return;

    const stringhe = new Set<string>();
    this.portate.forEach(p => {
      if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) stringhe.add(p.nomePersonalizzato);
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
            const statusOk = Number(data.responseStatus) === 200;
            if (tradotto && tradotto !== testo && statusOk) nuovaCache.set(testo, tradotto);
          } catch {
            errori++;
          }
        }),
      );
      if (i + BATCH < lista.length) await new Promise(res => setTimeout(res, 120));
    }

    this.cacheTraduzioni.set(codice, nuovaCache);
    this.isTraducendo = false;
    if (errori > 0 && nuovaCache.size === 0) {
      this.erroreTraduzioneVisible = true;
      setTimeout(() => (this.erroreTraduzioneVisible = false), 4000);
    }
  }

  // ── Caricamento ─────────────────────────────────────────────────
  async caricaMenu(id: string): Promise<void> {
    // ⚠️  Tutti gli endpoint usano /api/PUBLIC → nessuna auth richiesta
    const BASE = '/api/public';
    try {
      this.menu = (await this.http.get<Menu>(`${BASE}/menus/${id}`).toPromise()) ?? null;

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
        const tuttiAllergeni: Allergene[] = (await this.http.get<Allergene[]>(`${BASE}/allergenes`).toPromise()) ?? [];
        this.allergeniMap = new Map(tuttiAllergeni.map(a => [String(a.id), a]));
        this.allergeniByNome = new Map(tuttiAllergeni.map(a => [a.nome.toLowerCase().trim(), a]));
      } catch (e) {
        console.warn('Allergeni non disponibili.', e);
      }

      const immagini: any[] = (await this.http.get<any[]>(`${BASE}/menus/${id}/immagini`).toPromise()) ?? [];
      const logo = immagini.find(i => i.tipo === 'LOGO');
      if (logo?.immagine) {
        const blob = this.base64ToBlob(logo.immagine, logo.immagineContentType);
        this.logoUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
      }

      const copertine = immagini
        .filter(i => i.tipo === 'COPERTINA' && i.visibile !== false)
        .sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0))
        .map(i => `data:${i.immagineContentType};base64,${i.immagine}`);
      this.modernoImmagini = copertine;
      this.rusticoImmagini = copertine;
      this.modernoImmaginiCaricate = new Array(copertine.length).fill(false);
      this.rusticoImmaginiCaricate = new Array(copertine.length).fill(false);

      const portateRaw: any[] = (await this.http.get<any[]>(`${BASE}/menus/${id}/portatas`).toPromise()) ?? [];
      const portateCaricate = await Promise.all(
        portateRaw.map(async p => {
          const prodotti: Prodotto[] = (await this.http.get<Prodotto[]>(`${BASE}/prodottos/by-portata/${p.id}`).toPromise()) ?? [];
          prodotti.forEach(prod => this.prodottiMap.set(String(prod.id), prod));
          return { ...p, prodotti, aperta: false };
        }),
      );
      this.portate = this.ordinaPortate(portateCaricate);

      const piattiAttivi: any[] = (await this.http.get<any[]>(`${BASE}/menus/${id}/piatti-del-giorno`).toPromise()) ?? [];
      this.piattiDelGiorno = piattiAttivi.map(p => this.arricchisciPiatto(p));

      if (this.menu?.templateStyle === 'MODERNO' && this.modernoImmagini.length > 0) this.avviaAutoplay();
      if (this.menu?.templateStyle === 'RUSTICO' && this.rusticoImmagini.length > 0) this.avviaAutoplayRustico();

      try {
        this.listeContatti = (await this.http.get<ListaContatti[]>(`${BASE}/lista-contattis/menu/${id}`).toPromise()) ?? [];
      } catch (e) {
        console.warn('Contatti non disponibili:', e);
        this.listeContatti = [];
      }
    } catch (err) {
      console.error('Errore caricamento menu pubblico:', err);
      this.errore = true;
    } finally {
      this.isLoading = false;
    }
  }

  // ── Contatti ────────────────────────────────────────────────────
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
    return null;
  }

  getContattoLabel(item: ContattoItem): string {
    if (item.tipo === 'SOCIAL') {
      if (item.etichetta?.trim()) return item.etichetta.trim();
      if (item.reteSociale && item.reteSociale !== 'ALTRO') {
        return item.reteSociale.charAt(0) + item.reteSociale.slice(1).toLowerCase().replace('_', ' ');
      }
      return item.valore;
    }
    return item.valore;
  }

  // ── Template helpers ─────────────────────────────────────────────
  private arricchisciPiatto(piatto: any): any {
    if (piatto.prodotto?.id) {
      const prodottoCompleto = this.prodottiMap.get(String(piatto.prodotto.id));
      if (prodottoCompleto) {
        const allergeniArricchiti = (prodottoCompleto.allergenis ?? []).map(
          a => this.allergeniMap.get(String(a.id)) ?? this.allergeniByNome.get((a.nome ?? '').toLowerCase().trim()) ?? a,
        );
        return { ...piatto, prodotto: { ...prodottoCompleto, allergenis: allergeniArricchiti } };
      }
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

  // ── Touch / Swipe ─────────────────────────────────────────────

  onTouchStart(event: TouchEvent, template: 'moderno' | 'rustico'): void {
    this.touchStartX = event.changedTouches[0].clientX;
    if (template === 'moderno') this.fermaAutoplay();
    else this.fermaAutoplayRustico();
  }

  onTouchEnd(event: TouchEvent, template: 'moderno' | 'rustico'): void {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(deltaX) >= this.SWIPE_THRESHOLD) {
      if (template === 'moderno') {
        this.modernoGoToSlide(deltaX < 0 ? this.modernoCarouselIndex + 1 : this.modernoCarouselIndex - 1);
        setTimeout(() => this.avviaAutoplay(), 4000);
      } else {
        this.rusticoGoToSlide(deltaX < 0 ? this.rusticoCarouselIndex + 1 : this.rusticoCarouselIndex - 1);
        setTimeout(() => this.avviaAutoplayRustico(), 4000);
      }
    } else {
      if (template === 'moderno') this.avviaAutoplay();
      else this.avviaAutoplayRustico();
    }
  }

  // ── Stato caricamento immagini ─────────────────────────────────

  onImmagineCaricata(template: 'moderno' | 'rustico', index: number): void {
    if (template === 'moderno') {
      this.modernoImmaginiCaricate = [...this.modernoImmaginiCaricate];
      this.modernoImmaginiCaricate[index] = true;
    } else {
      this.rusticoImmaginiCaricate = [...this.rusticoImmaginiCaricate];
      this.rusticoImmaginiCaricate[index] = true;
    }
  }

  onImmagineErrore(template: 'moderno' | 'rustico', index: number): void {
    this.onImmagineCaricata(template, index);
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
    if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) return this.getT(p.nomePersonalizzato);
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
