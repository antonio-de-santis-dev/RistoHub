import { Component, OnInit, Signal, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { firstValueFrom } from 'rxjs';
import { MenuDTO, PiattoDelGiornoDTO } from 'app/shared/model/risto.model';
import { TutorialComponent } from 'app/shared/tutorial/tutorial.component';
import { TutorialService } from 'app/shared/tutorial/tutorial.service';

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
  private readonly tutorialService = inject(TutorialService);

  account: Signal<Account | null> = this.accountService.trackCurrentAccount();

  // Piatti del giorno
  piattiAttivi: PiattoDelGiornoDTO[] = [];
  isLoadingPiatti = true;

  // Menu attivi
  menuAttivi: MenuDTO[] = [];
  isLoadingMenus = true;

  // QR Modal
  qrVisible = false;
  qrMenuId: string | null = null;

  ngOnInit(): void {
    if (this.account() !== null) {
      this.caricaDashboard();
    } else {
      this.accountService.identity().subscribe(acc => {
        if (acc) this.caricaDashboard();
      });
    }
  }

  async caricaDashboard(): Promise<void> {
    const account = this.account();
    if (!account) return;

    this.isLoadingPiatti = true;
    this.isLoadingMenus = true;

    try {
      const tuttiMenu: MenuDTO[] = (await firstValueFrom(this.http.get<MenuDTO[]>('/api/menus'))) ?? [];
      this.menuAttivi = tuttiMenu.filter(m => m.attivo);
      this.isLoadingMenus = false;

      const tutti: PiattoDelGiornoDTO[] = (await firstValueFrom(this.http.get<PiattoDelGiornoDTO[]>('/api/piatto-del-giornos/my'))) ?? [];
      this.piattiAttivi = tutti.filter(p => p.attivo);
    } catch (err) {
      console.error('Errore dashboard:', err);
    } finally {
      this.isLoadingPiatti = false;
      this.isLoadingMenus = false;

      // Controlla se mostrare il tutorial dopo il caricamento
      const acc = this.account();
      if (acc) {
        // tutorialCompleted viene letto dall'oggetto account restituito da /api/account
        const tutorialCompleted = (acc as any).tutorialCompleted ?? false;
        this.tutorialService.checkAndShow(tutorialCompleted);
      }
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
