import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  selector: 'jhi-menu-view',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './menu-view.component.html',
  styleUrls: ['./menu-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuViewComponent implements OnInit, OnDestroy {
  menu: MenuDTO | null = null;
  portate: PortataConProdottiDTO[] = [];
  logoUrl: SafeUrl | null = null;
  isLoading = true;
  errore = false;
  piattiDelGiorno: PiattoDelGiornoDTO[] = [];
  piattiGiornoAperti = false;

  // ── Contatti ──────────────────────────────────────────────────
  listeContatti: ListaContattiDTO[] = [];

  allergeniMap: Map<string, AllergeneDTO> = new Map();
  private allergeniByNome: Map<string, AllergeneDTO> = new Map();
  private prodottiMap: Map<string, ProdottoDTO> = new Map();
  private _tuttiAllergeniMenu: AllergeneDTO[] = [];

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

  readonly LINGUE: Lingua[] = LINGUE_CONST;

  linguaCorrente = 'it';
  isTraducendo = false;
  mostraDropdownLingua = false;
  erroreTraduzioneVisible = false;

  // ── Getters di comodità ──
  get linguaAttuale(): Lingua {
    return this.LINGUE.find(l => l.codice === this.linguaCorrente) ?? this.LINGUE[0];
  }

  /** Restituisce testo dinamico tradotto (nome/descrizione prodotto) */
  getT(testo: string | undefined | null): string {
    if (!testo) return testo ?? '';
    if (this.linguaCorrente === 'it') return testo;
    return this.traduzioneService.getCached(this.linguaCorrente)?.get(testo) ?? testo;
  }

  /** Restituisce etichetta UI statica tradotta */
  getUI(chiave: string): string {
    return UI_LABELS[chiave]?.[this.linguaCorrente] ?? UI_LABELS[chiave]?.['it'] ?? chiave;
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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

      // ── 2. Allergeni ─────────────────────────────────────────
      const tuttiAllergeni: AllergeneDTO[] = dati.allergeni ?? [];
      this.allergeniDisponibili = tuttiAllergeni;
      this.allergeniMap = new Map(tuttiAllergeni.map((a: AllergeneDTO) => [String(a.id), a]));
      this.allergeniByNome = new Map(tuttiAllergeni.map((a: AllergeneDTO) => [a.nome.toLowerCase().trim(), a]));

      // ── 3. Immagini (logo + carosello copertine) ─────────────
      // Il backend restituisce ImmagineMenuMetaDTO con contentUrl (senza byte[])
      const immagini: ImmagineMenuMetaDTO[] = (dati.immagini as unknown as ImmagineMenuMetaDTO[]) ?? [];
      const logo = immagini.find(i => i.tipo === 'LOGO');
      if (logo?.contentUrl) {
        this.logoUrl = this.sanitizer.bypassSecurityTrustUrl(logo.contentUrl);
      }
      const copertine = immagini
        .filter((i: ImmagineMenuMetaDTO) => i.tipo === 'COPERTINA' && i.visibile !== false)
        .sort((a: ImmagineMenuMetaDTO, b: ImmagineMenuMetaDTO) => (a.ordine ?? 0) - (b.ordine ?? 0))
        .map((i: ImmagineMenuMetaDTO) => i.contentUrl);
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
      this.portate = ordinaPortate(portateConProdotti, ORDINE_PORTATE);

      // ── 5. Piatti del giorno ─────────────────────────────────
      const piattiAttivi: PiattoDelGiornoDTO[] = dati.piattiDelGiorno ?? [];
      this.piattiDelGiorno = piattiAttivi.map(p => this.arricchisciPiatto(p));
      this.calcolaTuttiAllergeni();

      // ── 6. Autoplay carosello ─────────────────────────────────
      if (this.menu?.templateStyle === 'MODERNO' && this.modernoImmagini.length > 0) this.avviaAutoplay();
      if (this.menu?.templateStyle === 'RUSTICO' && this.rusticoImmagini.length > 0) this.avviaAutoplayRustico();
      this.cdr.markForCheck();

      // ── 7. Contatti ───────────────────────────────────────────
      this.listeContatti = dati.contatti ?? [];
    } catch (err) {
      console.error('Errore caricamento menu:', err);
      this.errore = true;
    } finally {
      this.isLoading = false;
    }
    // ── 8. Popola cache traduzioni dal payload (zero chiamate API esterne) ───
    this.traduzioneService.clearCache();
    this.traduzioneService.popolaDaDati(this.portate, this.piattiDelGiorno);
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
    if (item.tipo === 'INDIRIZZO') {
      return `https://maps.google.com/?q=${encodeURIComponent(item.valore)}`;
    }
    return null;
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
      // Risincronizza le reference alle portate attive (moderno e rustico tengono un ref
      // diretto all'oggetto portata; senza questo refresh la lista visualizzata non si aggiorna)
      if (this.rusticoPortataAttiva) {
        this.rusticoPortataAttiva = this.portate.find(p => p.id === this.rusticoPortataAttiva!.id) ?? null;
      }
      if (this.modernoPortataAttiva) {
        this.modernoPortataAttiva = this.portate.find(p => p.id === this.modernoPortataAttiva!.id) ?? null;
      }
      this.calcolaTuttiAllergeni();
      // Invalida le cache di traduzione perché il testo è cambiato
      this.traduzioneService.clearCache();
      this.chiudiModifica();
    } catch (err) {
      console.error('Errore modifica prodotto:', err);
      this.editErrore = 'Errore durante il salvataggio. Riprova.';
    } finally {
      this.isSavingEdit = false;
      this.cdr.markForCheck();
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
      // Risincronizza le reference alle portate attive (moderno e rustico tengono un ref
      // diretto all'oggetto portata; senza questo refresh il prodotto eliminato resta visibile)
      if (this.rusticoPortataAttiva) {
        this.rusticoPortataAttiva = this.portate.find(p => p.id === this.rusticoPortataAttiva!.id) ?? null;
      }
      if (this.modernoPortataAttiva) {
        this.modernoPortataAttiva = this.portate.find(p => p.id === this.modernoPortataAttiva!.id) ?? null;
      }
      this.calcolaTuttiAllergeni();
      this.chiudiConfermaEliminazione();
    } catch (err) {
      console.error('Errore eliminazione prodotto:', err);
    } finally {
      this.isDeleting = false;
      this.cdr.markForCheck();
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
      this.modernoImmaginiCaricate[index] = true;
    } else {
      this.rusticoImmaginiCaricate[index] = true;
    }
    this.cdr.markForCheck();
  }

  onImmagineErrore(template: 'moderno' | 'rustico', index: number): void {
    // In caso di errore segniamo comunque come "caricata" per nascondere lo skeleton
    this.onImmagineCaricata(template, index);
  }

  getAllergeneIcona(a: AllergeneDTO): string {
    return getAllergeneIconaUtil(a, this.allergeniMap, this.allergeniByNome);
  }

  get tuttiAllergeniMenu(): AllergeneDTO[] {
    return this._tuttiAllergeniMenu;
  }

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
    if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) {
      return this.getT(p.nomePersonalizzato);
    }
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

  /** Sfondo card prodotto alternato: pari = primario, dispari = secondario. */
  getCardBg(index: number): string {
    return index % 2 === 0 ? this.colorePrimario : this.coloreSecondario;
  }

  /** Testo card prodotto: opposto rispetto allo sfondo. */
  getCardText(index: number): string {
    return index % 2 === 0 ? this.coloreSecondario : this.colorePrimario;
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

  get fontTesto(): string {
    return this.menu?.fontMenu ?? 'Playfair Display';
  }
  get isModerno(): boolean {
    return this.menu?.templateStyle === 'MODERNO';
  }
  get isRustico(): boolean {
    return this.menu?.templateStyle === 'RUSTICO';
  }
}
