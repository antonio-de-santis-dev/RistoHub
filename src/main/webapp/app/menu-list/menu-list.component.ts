import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { AccountDTO, MenuDTO } from 'app/shared/model/risto.model';

@Component({
  selector: 'jhi-menu-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-list.component.html',
  styleUrls: ['./menu-list.component.scss'],
})
export class MenuListComponent implements OnInit {
  menus: MenuDTO[] = [];
  isLoading = true;
  menuDaEliminare: MenuDTO | null = null;
  confermaEliminazioneVisibile = false;
  qrMenuId: string | null = null;
  qrVisible = false;

  toggling: string | null = null;

  toastMsg: string | null = null;
  toastType: 'success' | 'error' = 'success';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.caricaMenus();
  }

  async caricaMenus(): Promise<void> {
    try {
      const currentUser: AccountDTO = await firstValueFrom(this.http.get<AccountDTO>('/api/account'));
      const tutti: MenuDTO[] = (await firstValueFrom(this.http.get<MenuDTO[]>('/api/menus'))) ?? [];
      this.menus = tutti.filter(m => m.ristoratore?.login === currentUser.login);
    } catch (err) {
      console.error('Errore caricamento menu:', err);
    } finally {
      this.isLoading = false;
    }
  }

  async toggleAttivo(menu: MenuDTO): Promise<void> {
    if (this.toggling === menu.id) return;
    this.toggling = menu.id;
    const nuovoStato = !menu.attivo;
    try {
      try {
        await firstValueFrom(this.http.patch(`/api/menus/${menu.id}`, { id: menu.id, attivo: nuovoStato }));
      } catch {
        await firstValueFrom(this.http.put(`/api/menus/${menu.id}`, { ...menu, attivo: nuovoStato }));
      }
      menu.attivo = nuovoStato;
      this.mostraToast(
        nuovoStato ? `✅ "${menu.nome}" è ora visibile ai clienti` : `🔒 "${menu.nome}" è stato nascosto ai clienti`,
        'success',
      );
    } catch (err) {
      console.error('Errore toggle attivo:', err);
      this.mostraToast("❌ Errore durante l'aggiornamento. Riprova.", 'error');
    } finally {
      this.toggling = null;
    }
  }

  private mostraToast(msg: string, tipo: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastType = tipo;
    this.toastTimer = setTimeout(() => {
      this.toastMsg = null;
    }, 3500);
  }

  visualizza(id: string): void {
    this.router.navigate(['/menu-view', id]);
  }

  modifica(id: string): void {
    this.router.navigate(['/menu-wizard-edit', id]);
  }

  chiediConfermaElimina(menu: MenuDTO): void {
    this.menuDaEliminare = menu;
    this.confermaEliminazioneVisibile = true;
  }

  annullaElimina(): void {
    this.menuDaEliminare = null;
    this.confermaEliminazioneVisibile = false;
  }

  async confermaElimina(): Promise<void> {
    if (!this.menuDaEliminare) return;
    const idDaEliminare = this.menuDaEliminare.id;
    try {
      await firstValueFrom(this.http.delete(`/api/menus/${idDaEliminare}`));
      this.menus = this.menus.filter(m => m.id !== idDaEliminare);
      this.mostraToast('🗑️ Menu eliminato con successo', 'success');
    } catch (err) {
      console.error('Errore eliminazione:', err);
      this.mostraToast("❌ Errore durante l'eliminazione", 'error');
    } finally {
      this.annullaElimina();
    }
  }

  mostraQr(id: string): void {
    this.qrMenuId = id;
    this.qrVisible = true;
  }

  chiudiQr(): void {
    this.qrVisible = false;
    this.qrMenuId = null;
  }

  get qrUrl(): string {
    return `${window.location.origin}/menu-public/${this.qrMenuId}`;
  }

  get qrImageUrl(): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(this.qrUrl)}`;
  }

  /**
   * Scarica il QR code come file PNG.
   * Usa fetch + Blob per forzare il download anche da URL cross-origin
   * (il semplice attributo HTML "download" non funziona su risorse esterne).
   */
  async scaricaQr(): Promise<void> {
    try {
      const response = await fetch(this.qrImageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-menu-${this.qrMenuId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Errore download QR:', err);
      this.mostraToast('❌ Errore durante il download del QR', 'error');
    }
  }

  /** Apre la pagina pubblica del menu in una nuova scheda. */
  apriMenuPubblico(): void {
    window.open(this.qrUrl, '_blank');
  }

  templateLabel(style: string | undefined): string {
    const map: Record<string, string> = {
      CLASSICO: '🍷 Classico',
      MODERNO: '⚡ Moderno',
      RUSTICO: '🌿 Rustico',
    };
    return map[style ?? ''] ?? '📋 Standard';
  }

  // ── Nuovi metodi per immagini copertina ───────────────

  /**
   * Restituisce true per i template che hanno il carosello immagini.
   * Moderno e Rustico = carosello attivo.
   */
  haCarosello(menu: MenuDTO): boolean {
    return menu.templateStyle === 'MODERNO' || menu.templateStyle === 'RUSTICO';
  }

  modificaCopertina(id: string): void {
    this.router.navigate(['/menu-cover-editor', id]);
  }
}
