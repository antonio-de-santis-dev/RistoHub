import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface Prodotto {
  id: string;
  nome: string;
  descrizione?: string;
  prezzo: number;
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

  async caricaMenu(id: string): Promise<void> {
    try {
      // 1. Carica il menu
      this.menu = (await this.http.get<Menu>(`/api/menus/${id}`).toPromise()) ?? null;

      // 2. Carica il font
      if (this.menu?.fontMenu) {
        const fontName = this.menu.fontMenu.replace(/ /g, '+');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;700&display=swap`;
        document.head.appendChild(link);
      }

      // 3. Carica il logo
      const immagini: any[] = (await this.http.get<any[]>(`/api/menus/${id}/immagini`).toPromise()) ?? [];
      const logo = immagini.find(i => i.tipo === 'LOGO');
      if (logo?.immagine) {
        const blob = this.base64ToBlob(logo.immagine, logo.immagineContentType);
        this.logoUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
      }

      // 4. Carica le portate
      const portateRaw: any[] = (await this.http.get<any[]>(`/api/menus/${id}/portatas`).toPromise()) ?? [];

      // 5. Carica i prodotti per ogni portata
      this.portate = await Promise.all(
        portateRaw.map(async p => {
          const prodotti: Prodotto[] = (await this.http.get<Prodotto[]>(`/api/prodottos/by-portata/${p.id}`).toPromise()) ?? [];
          return { ...p, prodotti, aperta: false };
        }),
      );
    } catch (err) {
      console.error('Errore caricamento menu:', err);
      this.errore = true;
    } finally {
      this.isLoading = false;
    }
  }

  togglePortata(portata: Portata): void {
    portata.aperta = !portata.aperta;
  }

  nomePortata(p: Portata): string {
    if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) {
      return p.nomePersonalizzato;
    }
    return (p.nomeDefault ?? '').replace(/_/g, ' ');
  }

  formatPrezzo(p: number): string {
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

  private base64ToBlob(base64: string, type: string): Blob {
    const binary = atob(base64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type });
  }
}
