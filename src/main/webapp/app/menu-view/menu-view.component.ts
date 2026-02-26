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
    } catch (err) {
      console.error('Errore caricamento menu:', err);
      this.errore = true;
    } finally {
      this.isLoading = false;
    }
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
