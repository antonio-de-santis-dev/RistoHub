import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'jhi-prodotto-add',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './prodotto-add.component.html',
  styleUrls: ['./prodotto-add.component.scss'],
})
export class ProdottoAddComponent implements OnInit {
  // Stato pagina
  isLoadingInit = true;
  isSaving = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // Selezione menu/portata
  menus: any[] = [];
  portate: any[] = [];
  menuSelezionatoId: string | null = null;
  portataSelezionataId: string | null = null;
  portataPreimpostata = false;

  // Allergeni
  allergeniDisponibili: any[] = [];
  allergeniSelezionati: Set<string> = new Set();

  // Campi prodotto
  nome = '';
  descrizione = '';
  prezzo: number | null = null;

  // Lista prodotti aggiunti in sessione
  prodottiAggiunti: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const portataId = this.route.snapshot.paramMap.get('portataId');
    if (portataId) {
      this.portataSelezionataId = portataId;
      this.portataPreimpostata = true;
      this.caricaAllergeni();
      this.caricaProdottiEsistenti(portataId);
      this.isLoadingInit = false;
    } else {
      this.caricaMenus();
    }
  }

  async caricaMenus(): Promise<void> {
    try {
      const currentUser: any = await this.http.get('/api/account').toPromise();
      const tutti: any[] = (await this.http.get<any[]>('/api/menus').toPromise()) ?? [];
      this.menus = tutti.filter(m => m.ristoratore?.login === currentUser.login);
      await this.caricaAllergeni();
    } catch (err) {
      console.error('Errore caricamento menu:', err);
    } finally {
      this.isLoadingInit = false;
    }
  }

  async onMenuSelezionato(): Promise<void> {
    if (!this.menuSelezionatoId) return;
    this.portate = [];
    this.portataSelezionataId = null;
    try {
      this.portate = (await this.http.get<any[]>(`/api/menus/${this.menuSelezionatoId}/portatas`).toPromise()) ?? [];
    } catch (err) {
      console.error('Errore caricamento portate:', err);
    }
  }

  async onPortataSelezionata(): Promise<void> {
    if (!this.portataSelezionataId) return;
    this.prodottiAggiunti = [];
    await this.caricaProdottiEsistenti(this.portataSelezionataId);
  }

  async caricaAllergeni(): Promise<void> {
    try {
      this.allergeniDisponibili = (await this.http.get<any[]>('/api/allergenes').toPromise()) ?? [];
    } catch (err) {
      console.error('Errore caricamento allergeni:', err);
    }
  }

  async caricaProdottiEsistenti(portataId: string): Promise<void> {
    try {
      const prodotti: any[] = (await this.http.get<any[]>(`/api/prodottos/by-portata/${portataId}`).toPromise()) ?? [];
      this.prodottiAggiunti = prodotti;
    } catch (err) {
      console.error('Errore caricamento prodotti:', err);
    }
  }

  toggleAllergene(id: string): void {
    if (this.allergeniSelezionati.has(id)) {
      this.allergeniSelezionati.delete(id);
    } else {
      this.allergeniSelezionati.add(id);
    }
  }

  nomePortata(p: any): string {
    if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) return p.nomePersonalizzato;
    return (p.nomeDefault ?? '').replace(/_/g, ' ');
  }

  resetForm(): void {
    this.nome = '';
    this.descrizione = '';
    this.prezzo = null;
    this.allergeniSelezionati = new Set();
    this.successMessage = null;
    this.errorMessage = null;
  }

  formValido(): boolean {
    return this.nome.trim() !== '' && this.prezzo !== null && this.prezzo > 0 && this.portataSelezionataId !== null;
  }

  async aggiungiProdotto(): Promise<void> {
    if (!this.formValido()) return;
    this.isSaving = true;
    this.successMessage = null;
    this.errorMessage = null;

    try {
      const allergeni = Array.from(this.allergeniSelezionati).map(id => ({ id }));
      const prodotto: any = await this.http
        .post('/api/prodottos', {
          nome: this.nome.trim(),
          descrizione: this.descrizione.trim() || null,
          prezzo: this.prezzo,
          portata: { id: this.portataSelezionataId },
          allergenis: allergeni,
        })
        .toPromise();

      this.prodottiAggiunti.unshift(prodotto);
      this.successMessage = `✅ "${prodotto.nome}" aggiunto con successo!`;
      this.resetForm();
    } catch (err) {
      console.error('Errore aggiunta prodotto:', err);
      this.errorMessage = '❌ Errore durante il salvataggio. Riprova.';
    } finally {
      this.isSaving = false;
    }
  }

  async eliminaProdotto(id: string): Promise<void> {
    try {
      await this.http.delete(`/api/prodottos/${id}`).toPromise();
      this.prodottiAggiunti = this.prodottiAggiunti.filter(p => p.id !== id);
    } catch (err) {
      console.error('Errore eliminazione:', err);
    }
  }

  formatPrezzo(p: number): string {
    return `€ ${Number(p).toFixed(2).replace('.', ',')}`;
  }
}
