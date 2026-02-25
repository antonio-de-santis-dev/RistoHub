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
  // Aggiunto il path corretto per caricare le immagini
  selectedTemplate: string | null = null;
  templates = [
    { id: 'CLASSICO', nome: 'Classico', immagine: '/content/images/view.png' },
    { id: 'MODERNO', nome: 'Moderno', immagine: '/content/images/view2.png' },
    { id: 'RUSTICO', nome: 'Rustico', immagine: '/content/images/view3.png' },
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
  portateDefault = [
    'ANTIPASTO',
    'PRIMO',
    'SECONDO',
    'CONTORNO',
    'BEVANDA',
    'BIRRA',
    'VINO_ROSSO',
    'VINO_ROSATO',
    'VINO_BIANCO',
    'DOLCE',
    'DIGESTIVO',
  ];
  portateSelezionate: Set<string> = new Set();
  portatePersonalizzate: string[] = [];
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
      const menu: any = await this.http.get(`/api/menus/${id}`).toPromise();
      this.nomeMenu = menu.nome ?? '';
      this.descrizioneMenu = menu.descrizione ?? '';
      this.selectedTemplate = menu.templateStyle ?? null;
      this.colorePrimario = menu.colorePrimario ?? '#C8102E';
      this.coloreSecondario = menu.coloreSecondario ?? '#F5E6C8';
      this.fontSelezionato = menu.fontMenu ?? 'Playfair Display';

      // Logo esistente
      const immagini: any[] = (await this.http.get<any[]>(`/api/menus/${id}/immagini`).toPromise()) ?? [];
      const logo = immagini.find(i => i.tipo === 'LOGO');
      if (logo) {
        this.logoEsistenteId = logo.id;
        this.logoEsistenteUrl = `data:${logo.immagineContentType};base64,${logo.immagine}`;
        this.logoPreview = this.logoEsistenteUrl;
      }

      // Portate esistenti
      const portate: any[] = (await this.http.get<any[]>(`/api/menus/${id}/portatas`).toPromise()) ?? [];
      this.portateEsistentiIds = portate.map(p => ({
        id: p.id,
        tipo: p.tipo,
        nomeDefault: p.nomeDefault,
        nomePersonalizzato: p.nomePersonalizzato,
      }));
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

  get progressoPercentuale(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  get titoloStep(): string {
    const t: Record<number, string> = {
      1: 'Scegli il tuo stile',
      2: 'Scegli i colori',
      3: 'Carica il logo',
      4: 'Scegli il font',
      5: 'Aggiungi le portate',
    };
    return t[this.currentStep] ?? '';
  }

  async salvaModifiche(): Promise<void> {
    if (!this.validaStep() || !this.menuId) return;
    this.isLoading = true;
    try {
      // 1. Aggiorna il menu con PATCH (partialUpdate) invece di PUT.
      const menuPayload = {
        id: this.menuId,
        nome: this.nomeMenu,
        descrizione: this.descrizioneMenu,
        templateStyle: this.selectedTemplate,
        colorePrimario: this.colorePrimario,
        coloreSecondario: this.coloreSecondario,
        fontMenu: this.fontSelezionato,
      };

      await this.http.patch(`/api/menus/${this.menuId}`, menuPayload).toPromise();

      // Ritorna al view a fine modifica
      this.router.navigate(['/menu-view', this.menuId]);
    } catch (err) {
      console.error('Errore durante il salvataggio:', err);
    } finally {
      this.isLoading = false;
    }
  }
}
