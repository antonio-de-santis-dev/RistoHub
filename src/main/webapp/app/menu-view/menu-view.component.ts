import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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

  get backRoute(): string {
    return '/menus';
  }

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

      if (this.menu?.templateStyle === 'MODERNO') this.avviaAutoplay();
      if (this.menu?.templateStyle === 'RUSTICO') this.avviaAutoplayRustico();
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

      // Aggiorna localmente in tutte le portate
      aggiornato.allergenis = allergenis.map(a => this.allergeniMap.get(String(a.id))).filter(Boolean);
      this.portate = this.portate.map(portata => ({
        ...portata,
        prodotti: (portata.prodotti ?? []).map(p => (p.id === aggiornato.id ? { ...aggiornato } : p)),
      }));
      this.prodottiMap.set(String(aggiornato.id), aggiornato);
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
  //  METODI ESISTENTI (invariati)
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

  // ── MODIFICA CRUCIALE QUI: RESTITUISCE L'IMMAGINE INVECE DI '' ──
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
