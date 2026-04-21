import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { TraduzioneService } from '../core/services/traduzione.service';
import {
  LINGUE as LINGUE_CONST,
  Lingua,
  NOMI_PORTATE,
  ORDINE_PORTATE,
  SOCIAL_ICONS_SVG,
  UI_LABELS,
} from '../shared/constants/menu-ui.constants';
import { getAllergeneIcona as getAllergeneIconaUtil, formatPrezzo as formatPrezzoUtil, ordinaPortate } from '../shared/utils/menu.utils';
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

@Component({
  selector: 'jhi-menu-public',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-public.component.html',
  styleUrls: ['./menu-public.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPublicComponent implements OnInit, OnDestroy {
  menu: MenuDTO | null = null;
  portate: PortataConProdottiDTO[] = [];
  logoUrl: SafeUrl | null = null;
  isLoading = true;
  errore = false;
  piattiDelGiorno: PiattoDelGiornoDTO[] = [];
  piattiGiornoAperti = false;
  listeContatti: ListaContattiDTO[] = [];

  allergeniMap: Map<string, AllergeneDTO> = new Map();
  private allergeniByNome: Map<string, AllergeneDTO> = new Map();
  private prodottiMap: Map<string, ProdottoDTO> = new Map();
  private _tuttiAllergeniMenu: AllergeneDTO[] = []; // OPT-06: cache memoizzata, aggiornata una volta al caricamento

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

  // Template moderno / rustico
  modernoTabAttiva: string | null = null;
  modernoPortataAttiva: PortataConProdottiDTO | null = null;
  modernoCarouselIndex = 0;
  modernoAutoplayTimer: ReturnType<typeof setInterval> | null = null;
  modernoImmagini: string[] = [];
  modernoImmaginiCaricate: boolean[] = [];

  rusticoTabAttiva: string | null = null;
  rusticoPortataAttiva: PortataConProdottiDTO | null = null;
  rusticoCarouselIndex = 0;
  rusticoAutoplayTimer: ReturnType<typeof setInterval> | null = null;
  rusticoImmagini: string[] = [];
  rusticoImmaginiCaricate: boolean[] = [];

  private touchStartX = 0;
  private readonly SWIPE_THRESHOLD = 40;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private traduzioneService: TraduzioneService,
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
    this.fermaAutoplay();
    this.fermaAutoplayRustico();
  }

  // ── Getters ─────────────────────────────────────────────────────
  get linguaAttuale(): Lingua {
    return this.LINGUE.find(l => l.codice === this.linguaCorrente) ?? this.LINGUE[0];
  }

  getT(testo: string | undefined | null): string {
    if (!testo) return testo ?? '';
    if (this.linguaCorrente === 'it') return testo;
    return this.traduzioneService.getCached(this.linguaCorrente)?.get(testo) ?? testo;
  }

  getUI(chiave: string): string {
    return UI_LABELS[chiave]?.[this.linguaCorrente] ?? UI_LABELS[chiave]?.['it'] ?? chiave;
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
    this.cdr.markForCheck();

    if (codice === 'it') return;

    // Le traduzioni sono già in cache (popolate da caricaMenu via popolaDaDati).
    // Se la cache per questa lingua è vuota E ci sono entità senza traduzioni,
    // chiediamo al backend di tradurre i record legacy e ricarichiamo il menu.
    const cacheLingua = this.traduzioneService.getCached(codice);
    if (cacheLingua && cacheLingua.size > 0) {
      this.cdr.markForCheck();
      return;
    }

    // Nessuna traduzione in cache: probabile menu legacy. Chiama fallback backend.
    this.isTraducendo = true;
    this.erroreTraduzioneVisible = false;
    this.cdr.markForCheck();

    const menuId = this.menu?.id;
    if (menuId) {
      const tradotti = await this.traduzioneService.translateMissing(menuId);
      if (tradotti > 0) {
        // Ricarica il menu per prendere le traduzioni appena generate
        await this.caricaMenu(menuId);
      } else {
        this.erroreTraduzioneVisible = true;
        setTimeout(() => {
          this.erroreTraduzioneVisible = false;
          this.cdr.markForCheck();
        }, 4000);
      }
    }
    this.isTraducendo = false;
    this.cdr.markForCheck();
  }

  /**
   * Raccoglie tutte le stringhe traducibili del menu: nomi portate personalizzate,
   * nomi e descrizioni di tutti i prodotti di tutte le portate, e dei piatti del giorno.
   */
  private raccogliStringheTraducibili(): Set<string> {
    const stringhe = new Set<string>();
    this.portate.forEach(p => {
      if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) stringhe.add(p.nomePersonalizzato);
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
    return stringhe;
  }

  // ── Caricamento ─────────────────────────────────────────────────
  async caricaMenu(id: string): Promise<void> {
    const BASE = '/api/public';
    try {
      // ── UNICA CHIAMATA HTTP: sostituisce le precedenti N+6 chiamate separate ──
      const dati = (await firstValueFrom(this.http.get<MenuCompletoDTO>(`${BASE}/menus/${id}/full`)))!;

      // ── menu: caricato, applicare font ────────────────────────────────────
      this.menu = dati.menu ?? null;

      const safeFontName = this.sanitizeFontName(this.menu?.fontMenu);
      if (safeFontName) {
        const fontName = safeFontName.replace(/ /g, '+');
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

      // ── allergeni ─────────────────────────────────────────────────────────
      const allergeni = dati.allergeni ?? [];
      this.allergeniMap = new Map(allergeni.map((a: AllergeneDTO) => [String(a.id), a] as [string, AllergeneDTO]));
      this.allergeniByNome = new Map(allergeni.map((a: AllergeneDTO) => [a.nome.toLowerCase().trim(), a] as [string, AllergeneDTO]));

      // ── immagini ──────────────────────────────────────────────────────────
      const immagini = (dati.immagini as unknown as ImmagineMenuMetaDTO[]) ?? [];
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

      // ── portate con prodotti già annidati (nessuna chiamata extra) ────────
      const portateCaricate = (dati.portate ?? []).map((p: PortataConProdottiDTO) => {
        (p.prodotti ?? []).forEach((prod: ProdottoDTO) => this.prodottiMap.set(String(prod.id), prod));
        return { ...p, aperta: false };
      });
      this.portate = ordinaPortate(portateCaricate, ORDINE_PORTATE);

      // ── piatti del giorno e contatti ──────────────────────────────────────
      this.piattiDelGiorno = (dati.piattiDelGiorno ?? []).map((p: PiattoDelGiornoDTO) => this.arricchisciPiatto(p));
      this.listeContatti = dati.contatti ?? [];
      this.traduzioneService.clearCache();
      this.traduzioneService.popolaDaDati(this.portate, this.piattiDelGiorno);

      // OPT-06: calcola una volta sola dopo che portate e piatti del giorno sono pronti
      this.calcolaTuttiAllergeni();

      if (this.menu?.templateStyle === 'MODERNO' && this.modernoImmagini.length > 0) this.avviaAutoplay();
      if (this.menu?.templateStyle === 'RUSTICO' && this.rusticoImmagini.length > 0) this.avviaAutoplayRustico();
      this.cdr.markForCheck();
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

  getContattoLink(item: ContattoItemDTO): string | null {
    if (item.tipo === 'TELEFONO') return `tel:${item.valore}`;
    if (item.tipo === 'EMAIL') return `mailto:${item.valore}`;
    if (item.tipo === 'SOCIAL') {
      const v = item.valore.trim();
      return v.startsWith('http') ? v : `https://${v}`;
    }
    if (item.tipo === 'INDIRIZZO') {
      return `https://maps.google.com/?q=${encodeURIComponent(item.valore)}`;
    }
    return null;
  }

  getContattoLabel(item: ContattoItemDTO): string {
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
  private sanitizeFontName(font: string | undefined | null): string | null {
    if (!font) return null;
    const safe = font.replace(/[^a-zA-Z0-9 \-]/g, '').trim();
    return safe.length > 0 && safe.length < 60 ? safe : null;
  }

  private arricchisciPiatto(piatto: PiattoDelGiornoDTO): PiattoDelGiornoDTO {
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
      this.modernoImmaginiCaricate[index] = true;
    } else {
      this.rusticoImmaginiCaricate[index] = true;
    }
    this.cdr.markForCheck();
  }

  onImmagineErrore(template: 'moderno' | 'rustico', index: number): void {
    this.onImmagineCaricata(template, index);
  }

  getAllergeneIcona(a: AllergeneDTO): string {
    return getAllergeneIconaUtil(a, this.allergeniMap, this.allergeniByNome);
  }

  // OPT-06: getter ora restituisce la cache pre-calcolata invece di rieseguire
  // le iterazioni ad ogni ciclo di change detection Angular.
  get tuttiAllergeniMenu(): AllergeneDTO[] {
    return this._tuttiAllergeniMenu;
  }

  // Calcola e memorizza tutti gli allergeni distinti del menu.
  // Va chiamata una sola volta dopo che portate e piattiDelGiorno sono stati popolati.
  private calcolaTuttiAllergeni(): void {
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
    this._tuttiAllergeniMenu = Array.from(map.values()) as AllergeneDTO[];
  }

  nomePortata(p: PortataConProdottiDTO): string {
    if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) return this.getT(p.nomePersonalizzato);
    const chiave = p.nomeDefault ?? '';
    const trad = NOMI_PORTATE[chiave];
    if (trad) return trad[this.linguaCorrente] ?? chiave.replace(/_/g, ' ');
    return chiave.replace(/_/g, ' ');
  }

  formatPrezzo(p: number | undefined | null): string {
    return formatPrezzoUtil(p);
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

  /** Restituisce '#ffffff' o '#000000' garantendo sempre contrasto leggibile. */
  getContrastColor(hex: string): string {
    const h = (hex ?? '#000000').replace('#', '');
    if (h.length < 6) return '#000000';
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.5 ? '#000000' : '#ffffff';
  }
  get isModerno(): boolean {
    return this.menu?.templateStyle === 'MODERNO';
  }
  get isRustico(): boolean {
    return this.menu?.templateStyle === 'RUSTICO';
  }
}
