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
      // Filtra solo i menu dell'utente loggato
      this.menus = tutti.filter(m => m.ristoratore?.login === currentUser.login);
    } catch (err) {
      console.error('Errore caricamento menu:', err);
    } finally {
      this.isLoading = false;
    }
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
    const idDaEliminare = this.menuDaEliminare.id; // ← salva l'id subito
    try {
      await this.http.delete(`/api/menus/${idDaEliminare}`).toPromise();
      this.menus = this.menus.filter(m => m.id !== idDaEliminare);
    } catch (err) {
      console.error('Errore eliminazione:', err);
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
}
