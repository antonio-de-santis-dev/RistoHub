import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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

@Component({
  selector: 'jhi-menu-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  // ── Mappa allergeni completi (con icona BLOB) caricata da /api/allergenes ──
  // Necessaria perché /api/prodottos non include i BLOB negli oggetti annidati
  allergeniMap: Map<string, Allergene> = new Map();

  get backRoute(): string {
    return '/menus';
  }

  // ── TEMPLATE MODERNO ──
  modernoTabAttiva: string | null = null;
  modernoPortataAttiva: Portata | null = null;
  modernoCarouselIndex = 0;
  modernoAutoplayTimer: any = null;
  modernoImmagini: string[] = [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
  ];

  // ── TEMPLATE RUSTICO ──
  rusticoTabAttiva: string | null = null;
  rusticoPortataAttiva: Portata | null = null;
  rusticoCarouselIndex = 0;
  rusticoAutoplayTimer: any = null;
  rusticoImmagini: string[] = [
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=80',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=900&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80',
  ];

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

      // ── CARICA ALLERGENI COMPLETI (con BLOB icona) ──
      // I prodotti annidati non includono il campo icona nella risposta API,
      // quindi carichiamo tutti gli allergeni separatamente e costruiamo una mappa
      const tuttiAllergeni: Allergene[] = (await this.http.get<Allergene[]>('/api/allergenes').toPromise()) ?? [];
      this.allergeniMap = new Map(tuttiAllergeni.map(a => [a.id, a]));

      // Logo
      const immagini: any[] = (await this.http.get<any[]>(`/api/menus/${id}/immagini`).toPromise()) ?? [];
      const logo = immagini.find(i => i.tipo === 'LOGO');
      if (logo?.immagine) {
        const blob = this.base64ToBlob(logo.immagine, logo.immagineContentType);
        this.logoUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
      }

      // Portate + prodotti
      const portateRaw: any[] = (await this.http.get<any[]>(`/api/menus/${id}/portatas`).toPromise()) ?? [];
      this.portate = await Promise.all(
        portateRaw.map(async p => {
          const prodotti: Prodotto[] = (await this.http.get<Prodotto[]>(`/api/prodottos/by-portata/${p.id}`).toPromise()) ?? [];
          return { ...p, prodotti, aperta: false };
        }),
      );

      // Piatti del giorno
      const piattiAttivi: any[] = (await this.http.get<any[]>(`/api/menus/${id}/piatti-del-giorno`).toPromise()) ?? [];
      this.piattiDelGiorno = piattiAttivi;

      if (this.menu?.templateStyle === 'MODERNO') this.avviaAutoplay();
      if (this.menu?.templateStyle === 'RUSTICO') this.avviaAutoplayRustico();
    } catch (err) {
      console.error('Errore caricamento menu:', err);
      this.errore = true;
    } finally {
      this.isLoading = false;
    }
  }

  // ════════════════════════════════════════════
  //  CLASSICO
  // ════════════════════════════════════════════
  togglePortata(portata: Portata): void {
    portata.aperta = !portata.aperta;
  }

  togglePiattiGiorno(): void {
    this.piattiGiornoAperti = !this.piattiGiornoAperti;
  }

  // ════════════════════════════════════════════
  //  MODERNO
  // ════════════════════════════════════════════
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

  // ════════════════════════════════════════════
  //  RUSTICO
  // ════════════════════════════════════════════
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

  // ════════════════════════════════════════════
  //  ALLERGENI
  // ════════════════════════════════════════════

  /**
   * Restituisce il data URL dell'icona cercando prima nella mappa completa.
   * La mappa ha i BLOB, gli allergeni annidati nei prodotti no.
   */
  getAllergeneIcona(a: Allergene): string {
    const completo = this.allergeniMap.get(a.id) ?? a;
    if (completo.icona && completo.iconaContentType) {
      return `data:${completo.iconaContentType};base64,${completo.icona}`;
    }
    return '';
  }

  /** Raccoglie tutti gli allergeni unici del menu usando la mappa completa */
  get tuttiAllergeniMenu(): Allergene[] {
    const map = new Map<string, Allergene>();

    this.portate.forEach(portata => {
      (portata.prodotti ?? []).forEach(p => {
        (p.allergenis ?? []).forEach(a => {
          if (a.id) {
            map.set(a.id, this.allergeniMap.get(a.id) ?? a);
          }
        });
      });
    });

    this.piattiDelGiorno.forEach(piatto => {
      const allergeni: Allergene[] = piatto.prodotto?.allergenis ?? piatto.allergenis ?? [];
      allergeni.forEach(a => {
        if (a.id) {
          map.set(a.id, this.allergeniMap.get(a.id) ?? a);
        }
      });
    });

    return Array.from(map.values());
  }

  // ════════════════════════════════════════════
  //  COMUNI
  // ════════════════════════════════════════════
  nomePortata(p: Portata): string {
    if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) return p.nomePersonalizzato;
    return (p.nomeDefault ?? '').replace(/_/g, ' ');
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
