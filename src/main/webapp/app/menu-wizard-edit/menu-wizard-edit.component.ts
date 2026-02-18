import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'jhi-menu-wizard-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './menu-wizard-edit.component.html',
  styleUrls: ['./menu-wizard-edit.component.scss'],
})
export class MenuWizardEditComponent implements OnInit {
  menuId: string | null = null;
  currentStep = 1;
  totalSteps = 5;
  isLoading = false;
  isLoadingDati = true;

  // Dati esistenti
  logoEsistenteId: string | null = null;
  logoEsistenteUrl: string | null = null;

  // Step 1 — Template
  selectedTemplate: number | null = null;
  templates = [
    { id: 1, nome: 'Classico', descrizione: 'Elegante e tradizionale, con bordi decorativi e layout centrato', icona: '🍷' },
    { id: 2, nome: 'Moderno', descrizione: 'Minimalista e pulito, con spaziatura generosa e tipografia bold', icona: '⚡' },
    { id: 3, nome: 'Rustico', descrizione: 'Caldo e accogliente, ispirato alla trattoria italiana', icona: '🌿' },
  ];

  // Step 2 — Colori
  colorePrimario = '#C8102E';
  coloreSecondario = '#F5E6C8';
  coloriConsigliati = [
    { primario: '#C8102E', secondario: '#F5E6C8', nome: 'Rosso Classico' },
    { primario: '#2C3E50', secondario: '#ECF0F1', nome: 'Blu Notte' },
    { primario: '#27AE60', secondario: '#FDFEFE', nome: 'Verde Fresco' },
    { primario: '#8E44AD', secondario: '#FAD7A0', nome: 'Viola Elegante' },
    { primario: '#E67E22', secondario: '#FEF9E7', nome: 'Arancio Caldo' },
    { primario: '#1A1A1A', secondario: '#F8F8F8', nome: 'Nero Minimalista' },
  ];

  // Step 3 — Logo
  logoPreview: string | null = null;
  logoFile: File | null = null;

  // Step 4 — Font
  fontSelezionato = 'Playfair Display';
  fontsConsigliati = [
    { nome: 'Playfair Display', esempio: 'Antipasto della Casa', tag: 'Elegante' },
    { nome: 'Lato', esempio: 'Antipasto della Casa', tag: 'Moderno' },
    { nome: 'Merriweather', esempio: 'Antipasto della Casa', tag: 'Classico' },
    { nome: 'Montserrat', esempio: 'Antipasto della Casa', tag: 'Contemporaneo' },
    { nome: 'Cormorant Garamond', esempio: 'Antipasto della Casa', tag: 'Raffinato' },
  ];

  // Step 5 — Portate
  portateDefault = ['ANTIPASTO', 'PRIMO', 'SECONDO', 'CONTORNO', 'DOLCE', 'BEVANDA', 'VINO_ROSSO', 'VINO_BIANCO', 'VINO_ROSATO', 'BIRRA'];
  portateSelezionate: Set<string> = new Set();
  portatePersonalizzate: string[] = [];
  // IDs delle portate esistenti per poterle eliminare
  portateEsistentiIds: { id: string; nomeDefault?: string; nomePersonalizzato?: string; tipo: string }[] = [];
  nuovaPortataCustom = '';
  nomeMenu = '';
  descrizioneMenu = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    // Carica Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;700&family=Cormorant+Garamond:wght@400;700&display=swap';
    document.head.appendChild(link);

    this.menuId = this.route.snapshot.paramMap.get('id');
    if (this.menuId) {
      this.caricaDatiEsistenti(this.menuId);
    }
  }

  async caricaDatiEsistenti(id: string): Promise<void> {
    try {
      // Carica menu
      const menu: any = await this.http.get(`/api/menus/${id}`).toPromise();
      this.nomeMenu = menu.nome ?? '';
      this.descrizioneMenu = menu.descrizione ?? '';
      this.selectedTemplate = menu.stileTemplate ?? null;
      this.colorePrimario = menu.colorePrimario ?? '#C8102E';
      this.coloreSecondario = menu.coloreSecondario ?? '#F5E6C8';
      this.fontSelezionato = menu.fontMenu ?? 'Playfair Display';

      // Carica logo esistente
      const immagini: any[] = (await this.http.get<any[]>(`/api/menus/${id}/immagini`).toPromise()) ?? [];
      const logo = immagini.find(i => i.tipo === 'LOGO');
      if (logo) {
        this.logoEsistenteId = logo.id;
        this.logoEsistenteUrl = `data:${logo.immagineContentType};base64,${logo.immagine}`;
        this.logoPreview = this.logoEsistenteUrl;
      }

      // Carica portate esistenti
      const portate: any[] = (await this.http.get<any[]>(`/api/menus/${id}/portatas`).toPromise()) ?? [];
      this.portateEsistentiIds = portate.map(p => ({
        id: p.id,
        tipo: p.tipo,
        nomeDefault: p.nomeDefault,
        nomePersonalizzato: p.nomePersonalizzato,
      }));

      // Precompila le set delle portate selezionate
      portate.forEach(p => {
        if (p.tipo === 'DEFAULT' && p.nomeDefault) {
          this.portateSelezionate.add(p.nomeDefault);
        } else if (p.tipo === 'PERSONALIZZATA' && p.nomePersonalizzato) {
          this.portatePersonalizzate.push(p.nomePersonalizzato);
        }
      });
    } catch (err) {
      console.error('Errore caricamento dati menu:', err);
    } finally {
      this.isLoadingDati = false;
    }
  }

  stepSuccessivo(): void {
    if (this.validaStep()) this.currentStep++;
  }
  stepPrecedente(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  validaStep(): boolean {
    if (this.currentStep === 1) return this.selectedTemplate !== null;
    if (this.currentStep === 5) return this.nomeMenu.trim() !== '' && this.portateSelezionate.size > 0;
    return true;
  }

  selezionaColori(c: { primario: string; secondario: string }): void {
    this.colorePrimario = c.primario;
    this.coloreSecondario = c.secondario;
  }

  onLogoSelezionato(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      this.logoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = e => {
        this.logoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  rimuoviLogo(): void {
    this.logoFile = null;
    this.logoPreview = null;
    this.logoEsistenteId = null;
    this.logoEsistenteUrl = null;
  }

  togglePortata(p: string): void {
    if (this.portateSelezionate.has(p)) this.portateSelezionate.delete(p);
    else this.portateSelezionate.add(p);
  }

  aggiungiPortataCustom(): void {
    const n = this.nuovaPortataCustom.trim();
    if (n && !this.portatePersonalizzate.includes(n)) {
      this.portatePersonalizzate.push(n);
      this.nuovaPortataCustom = '';
    }
  }

  rimuoviPortataCustom(nome: string): void {
    this.portatePersonalizzate = this.portatePersonalizzate.filter(p => p !== nome);
  }

  nomeLeggibile(p: string): string {
    return p
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, c => c.toUpperCase());
  }

  async salvaModifiche(): Promise<void> {
    if (!this.validaStep() || !this.menuId) return;
    this.isLoading = true;
    try {
      // 1. Aggiorna il menu (PUT)
      const currentUser: any = await this.http.get('/api/account').toPromise();
      await this.http
        .put(`/api/menus/${this.menuId}`, {
          id: this.menuId,
          nome: this.nomeMenu,
          descrizione: this.descrizioneMenu,
          attivo: true,
          stileTemplate: this.selectedTemplate,
          colorePrimario: this.colorePrimario,
          coloreSecondario: this.coloreSecondario,
          fontMenu: this.fontSelezionato,
          ristoratore: { id: currentUser.id, login: currentUser.login },
        })
        .toPromise();

      // 2. Elimina tutte le portate esistenti e ricreale
      for (const p of this.portateEsistentiIds) {
        await this.http.delete(`/api/portatas/${p.id}`).toPromise();
      }
      const p1 = Array.from(this.portateSelezionate).map(p =>
        this.http.post('/api/portatas', { tipo: 'DEFAULT', nomeDefault: p, menu: { id: this.menuId } }).toPromise(),
      );
      const p2 = this.portatePersonalizzate.map(n =>
        this.http.post('/api/portatas', { tipo: 'PERSONALIZZATA', nomePersonalizzato: n, menu: { id: this.menuId } }).toPromise(),
      );
      await Promise.all([...p1, ...p2]);

      // 3. Gestione logo
      if (this.logoFile) {
        // Se c'era un logo vecchio, eliminalo
        if (this.logoEsistenteId) {
          await this.http.delete(`/api/immagine-menus/${this.logoEsistenteId}`).toPromise();
        }
        // Carica il nuovo logo
        const reader = new FileReader();
        reader.readAsDataURL(this.logoFile);
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await this.http
            .post('/api/immagine-menus', {
              nome: 'logo',
              immagine: base64,
              immagineContentType: this.logoFile!.type,
              tipo: 'LOGO',
              menu: { id: this.menuId },
            })
            .toPromise();
          this.router.navigate(['/menu-view', this.menuId]);
        };
      } else if (!this.logoPreview && this.logoEsistenteId) {
        // L'utente ha rimosso il logo senza caricarne uno nuovo
        await this.http.delete(`/api/immagine-menus/${this.logoEsistenteId}`).toPromise();
        this.router.navigate(['/menu-view', this.menuId]);
      } else {
        this.router.navigate(['/menu-view', this.menuId]);
      }
    } catch (err) {
      console.error('Errore salvataggio:', err);
      this.isLoading = false;
    }
  }

  get progressoPercentuale(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  get titoloStep(): string {
    const t: Record<number, string> = {
      1: 'Modifica stile',
      2: 'Modifica colori',
      3: 'Modifica logo',
      4: 'Modifica font',
      5: 'Modifica portate',
    };
    return t[this.currentStep] ?? '';
  }
}
