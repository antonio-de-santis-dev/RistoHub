import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'jhi-menu-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-list.component.html',
  styleUrls: ['./menu-list.component.scss'],
})
export class MenuListComponent implements OnInit {
  menus: any[] = [];
  isLoading = true;
  menuDaEliminare: any = null;
  confermaEliminazioneVisibile = false;
  qrMenuId: string | null = null;
  qrVisible = false;

  // Toggle attivo
  toggling: string | null = null;

  // Toast feedback
  toastMsg: string | null = null;
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.caricaMenus();
  }

  async caricaMenus(): Promise<void> {
    try {
      const currentUser: any = await this.http.get('/api/account').toPromise();
      const tutti: any[] = (await this.http.get<any[]>('/api/menus').toPromise()) ?? [];
      this.menus = tutti.filter(m => m.ristoratore?.login === currentUser.login);
    } catch (err) {
      console.error('Errore caricamento menu:', err);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Toggle attivo/inattivo del menu.
   * Usa PATCH per aggiornare solo il campo 'attivo'.
   * Se il server non supporta PATCH, fallback a PUT con tutti i dati.
   */
  async toggleAttivo(menu: any): Promise<void> {
    if (this.toggling === menu.id) return;
    this.toggling = menu.id;

    const nuovoStato = !menu.attivo;

    try {
      // Prova prima con PATCH (più sicuro, non tocca altri campi)
      try {
        await this.http.patch(`/api/menus/${menu.id}`, { id: menu.id, attivo: nuovoStato }).toPromise();
      } catch {
        // Fallback a PUT con tutti i dati del menu
        await this.http.put(`/api/menus/${menu.id}`, { ...menu, attivo: nuovoStato }).toPromise();
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

  chiediConfermaElimina(menu: any): void {
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
      await this.http.delete(`/api/menus/${idDaEliminare}`).toPromise();
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

  templateLabel(style: string | undefined): string {
    const map: Record<string, string> = {
      CLASSICO: '🍷 Classico',
      MODERNO: '⚡ Moderno',
      RUSTICO: '🌿 Rustico',
    };
    return map[style ?? ''] ?? '📋 Standard';
  }
}
