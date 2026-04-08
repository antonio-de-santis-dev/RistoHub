import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import {
  AllergeneDTO,
  ContattoItemDTO,
  ImmagineMenuDTO,
  ImmagineMenuMetaDTO,
  ListaContattiDTO,
  MenuCompletoDTO,
  MenuDTO,
  PiattoDelGiornoDTO,
  PortataConProdottiDTO,
  ProdottoDTO,
} from 'app/shared/model/risto.model';
import { SOCIAL_ICONS_SVG } from 'app/shared/model/social-icons';

// ── COSTANTE PER L'IMMAGINE DEGLI ALLERGENI PERSONALIZZATI ──
const ALLERGENE_MANUALE_ICONA = '/content/images/allergene-manuale.png';

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
export class MenuViewComponent implements OnInit, OnDestroy {
  menu: MenuDTO | null = null;
  portate: PortataConProdottiDTO[] = [];
  logoUrl: SafeUrl | null = null;
  private _logoBlobUrl: string | null = null;
  isLoading = true;
  errore = false;
  piattiDelGiorno: PiattoDelGiornoDTO[] = [];
  piattiGiornoAperti = false;

  // ── Contatti ──────────────────────────────────────────────────
  listeContatti: ListaContattiDTO[] = [];

  allergeniMap: Map<string, AllergeneDTO> = new Map();
  private allergeniByNome: Map<string, AllergeneDTO> = new Map();
  private prodottiMap: Map<string, ProdottoDTO> = new Map();

  // ── Modifica prodotto ──
  prodottoInModifica: ProdottoDTO | null = null;
  editNome = '';
  editDescrizione = '';
  editPrezzo: number | null = null;
  editAllergeniSelezionati: Set<string> = new Set();
  allergeniDisponibili: AllergeneDTO[] = [];
  isSavingEdit = false;
  editErrore: string | null = null;

  // ── Conferma eliminazione ──
  prodottoInEliminazione: ProdottoDTO | null = null;
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
  private traduzioneCancelToken: AbortController | null = null;

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
      (p.prodotti ?? []).forEach((prod: ProdottoDTO) => {
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

    // Annulla l'eventuale fetch in corso (cambio lingua rapido).
    this.traduzioneCancelToken?.abort();
    this.traduzioneCancelToken = new AbortController();
    const signal = this.traduzioneCancelToken.signal;

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
            const resp = await fetch(url, { signal });
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
          } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') return; // annullamento intenzionale
            errori++;
          }
        }),
      );
      // Piccola pausa tra batch per non inondare l'API
      if (i + BATCH < lista.length) {
        await new Promise(res => setTimeout(res, 120));
      }
    }

    // Aggiorna lo stato solo se questa invocazione non è stata annullata.
    if (!signal.aborted) {
      this.cacheTraduzioni.set(codice, nuovaCache);
      this.isTraducendo = false;
      if (errori > 0 && nuovaCache.size === 0) {
        this.erroreTraduzioneVisible = true;
        setTimeout(() => (this.erroreTraduzioneVisible = false), 4000);
      }
    }
  }

  // ══════════════════════════════════════════════════

  get backRoute(): string {
    return '/menus';
  }

  modernoTabAttiva: string | null = null;
  modernoPortataAttiva: PortataConProdottiDTO | null = null;
  modernoCarouselIndex = 0;
  modernoAutoplayTimer: ReturnType<typeof setInterval> | null = null;
  modernoImmagini: string[] = []; // ← popolato dal DB (immagini COPERTINA visibili)
  modernoImmaginiCaricate: boolean[] = []; // stato loading per ogni slide

  rusticoTabAttiva: string | null = null;
  rusticoPortataAttiva: PortataConProdottiDTO | null = null;
  rusticoCarouselIndex = 0;
  rusticoAutoplayTimer: ReturnType<typeof setInterval> | null = null;
  rusticoImmagini: string[] = []; // ← popolato dal DB (immagini COPERTINA visibili)
  rusticoImmaginiCaricate: boolean[] = []; // stato loading per ogni slide

  // ── Touch / Swipe ─────────────────────────────────────────────
  private touchStartX = 0;
  private readonly SWIPE_THRESHOLD = 40; // px minimi per riconoscere uno swipe

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

  ngOnDestroy(): void {
    if (this._logoBlobUrl) {
      URL.revokeObjectURL(this._logoBlobUrl);
      this._logoBlobUrl = null;
    }
    this.traduzioneCancelToken?.abort();
  }

  tornaAiMieiMenu(): void {
    this.router.navigate(['/menu-list']);
  }

  async caricaMenu(id: string): Promise<void> {
    try {
      // BUG-02 FIX: sostituisce N+1 chiamate HTTP separate con un'unica chiamata aggregata.
      // L'endpoint /api/public/menus/{id}/full restituisce in una sola risposta:
      //   menu, portate (con prodotti annidati), piattiDelGiorno, immagini, allergeni, contatti.
      // Prima: 1 (menu) + 1 (allergeni) + 1 (immagini) + 1 (portate) + N (prodotti per portata)
      //        + 1 (piatti giorno) + 1 (contatti) = 6 + N richieste serializzate.
      // Dopo:  1 sola richiesta.
      const dati: MenuCompletoDTO = await firstValueFrom(this.http.get<MenuCompletoDTO>(`/api/public/menus/${id}/full`));

      if (!dati) {
        this.errore = true;
        return;
      }

      // ── 1. Menu ───────────────────────────────────────────────
      this.menu = dati.menu ?? null;

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

      // ── 2. Allergeni ─────────────────────────────────────────
      const tuttiAllergeni: AllergeneDTO[] = dati.allergeni ?? [];
      this.allergeniDisponibili = tuttiAllergeni;
      this.allergeniMap = new Map(tuttiAllergeni.map((a: AllergeneDTO) => [String(a.id), a]));
      this.allergeniByNome = new Map(tuttiAllergeni.map((a: AllergeneDTO) => [a.nome.toLowerCase().trim(), a]));

      // ── 3. Immagini (logo + carosello copertine) ─────────────
      const immagini: ImmagineMenuMetaDTO[] = dati.immagini ?? [];
      const logo = immagini.find(i => i.tipo === 'LOGO');
      if (logo?.contentUrl) {
        this.logoUrl = this.sanitizer.bypassSecurityTrustUrl(logo.contentUrl);
      }
      const copertine = immagini
        .filter(i => i.tipo === 'COPERTINA' && i.visibile !== false)
        .sort((a, b) => (a.ordine ?? 0) - (b.ordine ?? 0))
        .map(i => i.contentUrl);
      this.modernoImmagini = copertine;
      this.rusticoImmagini = copertine;
      this.modernoImmaginiCaricate = new Array(copertine.length).fill(false);
      this.rusticoImmaginiCaricate = new Array(copertine.length).fill(false);

      // ── 4. Portate con prodotti annidati ─────────────────────
      // Il backend restituisce portate già con i prodotti dentro (PortataConProdottiDTO).
      // Popoliamo prodottiMap per riuso in arricchisciPiatto e salvaModifica.
      const portateRaw: PortataConProdottiDTO[] = dati.portate ?? [];
      const portateConProdotti = portateRaw.map(p => {
        const prodotti: ProdottoDTO[] = p.prodotti ?? [];
        prodotti.forEach((prod: ProdottoDTO) => this.prodottiMap.set(String(prod.id), prod));
        return { ...p, prodotti, aperta: false };
      });
      this.portate = this.ordinaPortate(portateConProdotti);

      // ── 5. Piatti del giorno ─────────────────────────────────
      const piattiAttivi: PiattoDelGiornoDTO[] = dati.piattiDelGiorno ?? [];
      this.piattiDelGiorno = piattiAttivi.map(p => this.arricchisciPiatto(p));

      // ── 6. Autoplay carosello ─────────────────────────────────
      if (this.menu?.templateStyle === 'MODERNO' && this.modernoImmagini.length > 0) this.avviaAutoplay();
      if (this.menu?.templateStyle === 'RUSTICO' && this.rusticoImmagini.length > 0) this.avviaAutoplayRustico();

      // ── 7. Contatti ───────────────────────────────────────────
      this.listeContatti = dati.contatti ?? [];
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

  getContattoLink(item: ContattoItemDTO): string | null {
    if (item.tipo === 'TELEFONO') return `tel:${item.valore}`;
    if (item.tipo === 'EMAIL') return `mailto:${item.valore}`;
    if (item.tipo === 'SOCIAL') {
      const v = item.valore.trim();
      return v.startsWith('http') ? v : `https://${v}`;
    }
    return null; // INDIRIZZO: nessun link
  }

  getContattoLabel(item: ContattoItemDTO): string {
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

  apriModifica(prodotto: ProdottoDTO): void {
    this.prodottoInModifica = prodotto;
    this.editNome = prodotto.nome;
    this.editDescrizione = prodotto.descrizione ?? '';
    this.editPrezzo = prodotto.prezzo;
    this.editAllergeniSelezionati = new Set((prodotto.allergenis ?? []).map((a: AllergeneDTO) => String(a.id)));
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
      const aggiornato: ProdottoDTO = await firstValueFrom(
        this.http.put<ProdottoDTO>(`/api/prodottos/${this.prodottoInModifica.id}`, body),
      );

      aggiornato.allergenis = allergenis.map(a => this.allergeniMap.get(String(a.id))).filter((a): a is AllergeneDTO => a !== undefined);
      this.portate = this.portate.map(portata => ({
        ...portata,
        prodotti: (portata.prodotti ?? []).map((p: ProdottoDTO) => (p.id === aggiornato.id ? { ...aggiornato } : p)),
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

  apriConfermaEliminazione(prodotto: ProdottoDTO): void {
    this.prodottoInEliminazione = prodotto;
  }

  chiudiConfermaEliminazione(): void {
    this.prodottoInEliminazione = null;
  }

  async confermanEliminazione(): Promise<void> {
    if (!this.prodottoInEliminazione) return;
    this.isDeleting = true;
    try {
      await firstValueFrom(this.http.delete(`/api/prodottos/${this.prodottoInEliminazione.id}`));
      const idEliminato = this.prodottoInEliminazione.id;
      this.portate = this.portate.map(portata => ({
        ...portata,
        prodotti: (portata.prodotti ?? []).filter((p: ProdottoDTO) => p.id !== idEliminato),
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
      if ((portata.prodotti ?? []).some((p: ProdottoDTO) => p.id === prodottoId)) {
        return portata.id;
      }
    }
    return null;
  }

  // ══════════════════════════════════════════════════
  //  METODI ESISTENTI
  // ══════════════════════════════════════════════════

  private arricchisciPiatto(piatto: PiattoDelGiornoDTO): PiattoDelGiornoDTO {
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
          (a: AllergeneDTO) => this.allergeniMap.get(String(a.id)) ?? this.allergeniByNome.get((a.nome ?? '').toLowerCase().trim()) ?? a,
        );
        return { ...piatto, prodotto: { ...piatto.prodotto, allergenis: allergeniArricchiti } };
      }
    }
    if (piatto.allergenis?.length) {
      return {
        ...piatto,
        allergenis: piatto.allergenis.map(
          (a: AllergeneDTO) => this.allergeniMap.get(String(a.id)) ?? this.allergeniByNome.get((a.nome ?? '').toLowerCase().trim()) ?? a,
        ),
      };
    }
    return piatto;
  }

  private ordinaPortate(portate: PortataConProdottiDTO[]): PortataConProdottiDTO[] {
    return [...portate].sort((a, b) => {
      const ordA = a.tipo === 'PERSONALIZZATA' ? 4 : (this.ORDINE_PORTATE[a.nomeDefault ?? ''] ?? 99);
      const ordB = b.tipo === 'PERSONALIZZATA' ? 4 : (this.ORDINE_PORTATE[b.nomeDefault ?? ''] ?? 99);
      return ordA - ordB;
    });
  }

  togglePortata(portata: PortataConProdottiDTO): void {
    portata.aperta = !portata.aperta;
  }
  togglePiattiGiorno(): void {
    this.piattiGiornoAperti = !this.piattiGiornoAperti;
  }

  modernoApriPortata(portata: PortataConProdottiDTO): void {
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

  rusticoApriTab(tabId: string, portata: PortataConProdottiDTO | null): void {
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
    // Pausa autoplay durante l'interazione
    if (template === 'moderno') this.fermaAutoplay();
    else this.fermaAutoplayRustico();
  }

  onTouchEnd(event: TouchEvent, template: 'moderno' | 'rustico'): void {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(deltaX) >= this.SWIPE_THRESHOLD) {
      if (template === 'moderno') {
        // Swipe left → avanti, swipe right → indietro
        this.modernoGoToSlide(deltaX < 0 ? this.modernoCarouselIndex + 1 : this.modernoCarouselIndex - 1);
        // Riprendi autoplay dopo 4 s
        setTimeout(() => this.avviaAutoplay(), 4000);
      } else {
        this.rusticoGoToSlide(deltaX < 0 ? this.rusticoCarouselIndex + 1 : this.rusticoCarouselIndex - 1);
        setTimeout(() => this.avviaAutoplayRustico(), 4000);
      }
    } else {
      // Tap senza swipe: riprendi autoplay
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
    // In caso di errore segniamo comunque come "caricata" per nascondere lo skeleton
    this.onImmagineCaricata(template, index);
  }

  getAllergeneIcona(a: AllergeneDTO): string {
    if (!a) return '';
    if (a.icona && a.iconaContentType) return `data:${a.iconaContentType};base64,${a.icona}`;
    const completo = this.allergeniMap.get(String(a.id ?? '')) ?? this.allergeniByNome.get((a.nome ?? '').toLowerCase().trim());
    if (completo?.icona && completo?.iconaContentType) return `data:${completo.iconaContentType};base64,${completo.icona}`;
    return ALLERGENE_MANUALE_ICONA;
  }

  get tuttiAllergeniMenu(): AllergeneDTO[] {
    const map = new Map<string, AllergeneDTO>();
    this.portate.forEach(portata => {
      (portata.prodotti ?? []).forEach((p: ProdottoDTO) => {
        (p.allergenis ?? []).forEach((a: AllergeneDTO) => {
          const key = String(a.id ?? a.nome ?? '');
          if (key) map.set(key, a);
        });
      });
    });
    this.piattiDelGiorno.forEach(piatto => {
      const lista: AllergeneDTO[] = piatto.prodotto?.allergenis ?? piatto.allergenis ?? [];
      lista.forEach(a => {
        const key = String(a.id ?? a.nome ?? '');
        if (key) map.set(key, a);
      });
    });
    return Array.from(map.values());
  }

  nomePortata(p: PortataConProdottiDTO): string {
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
