import { Component, OnInit, Signal, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';

@Component({
  selector: 'jhi-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export default class HomeComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  account: Signal<Account | null> = this.accountService.trackCurrentAccount();

  // Piatti del giorno
  piattiAttivi: any[] = [];
  isLoadingPiatti = true;

  // Menu attivi
  menuAttivi: any[] = [];
  isLoadingMenus = true;

  // QR Modal
  qrVisible = false;
  qrMenuId: string | null = null;

  ngOnInit(): void {
    if (this.account() !== null) {
      this.caricaDashboard();
    } else {
      // Osserva il login
      this.accountService.identity().subscribe(acc => {
        if (acc) this.caricaDashboard();
      });
    }
  }

  async caricaDashboard(): Promise<void> {
    await Promise.all([this.caricaPiattiAttivi(), this.caricaMenuAttivi()]);
  }

  async caricaPiattiAttivi(): Promise<void> {
    this.isLoadingPiatti = true;
    try {
      const currentUser: any = await this.http.get('/api/account').toPromise();
      const tutti: any[] = (await this.http.get<any[]>('/api/piatto-del-giornos').toPromise()) ?? [];
      // Filtra solo quelli attivi e del ristoratore loggato
      this.piattiAttivi = tutti.filter(p => p.attivo && (p.menu?.ristoratore?.login === currentUser.login || !p.menu));
    } catch (err) {
      console.error('Errore piatti del giorno:', err);
    } finally {
      this.isLoadingPiatti = false;
    }
  }

  async caricaMenuAttivi(): Promise<void> {
    this.isLoadingMenus = true;
    try {
      const currentUser: any = await this.http.get('/api/account').toPromise();
      const tutti: any[] = (await this.http.get<any[]>('/api/menus').toPromise()) ?? [];
      this.menuAttivi = tutti.filter(m => m.attivo && m.ristoratore?.login === currentUser.login);
    } catch (err) {
      console.error('Errore menu:', err);
    } finally {
      this.isLoadingMenus = false;
    }
  }

  apriMenu(id: string): void {
    this.router.navigate(['/menu-view', id]);
  }

  apriQr(id: string): void {
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

  formatPrezzo(p: number | undefined | null): string {
    if (p === undefined || p === null) return '—';
    return `€ ${Number(p).toFixed(2).replace('.', ',')}`;
  }
}
