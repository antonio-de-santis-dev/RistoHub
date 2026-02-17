import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'jhi-menu-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './menu-wizard.component.html',
  styleUrls: ['./menu-wizard.component.scss'],
})
export class MenuWizardComponent implements OnInit {
  currentStep = 1;
  totalSteps = 5;
  isLoading = false;

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
  portateSelezionate: Set<string> = new Set(['ANTIPASTO', 'PRIMO', 'SECONDO', 'DOLCE']);
  portatePersonalizzate: string[] = [];
  nuovaPortataCustom = '';
  nomeMenu = '';
  descrizioneMenu = '';

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;700&family=Cormorant+Garamond:wght@400;700&display=swap';
    document.head.appendChild(link);
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

  async generaMenu(): Promise<void> {
    if (!this.validaStep()) return;
    this.isLoading = true;
    try {
      const currentUser: any = await this.http.get('/api/account').toPromise();

      const menu: any = await this.http
        .post('/api/menus', {
          nome: this.nomeMenu,
          descrizione: this.descrizioneMenu,
          attivo: true,
          stileTemplate: this.selectedTemplate,
          colorePrimario: this.colorePrimario,
          coloreSecondario: this.coloreSecondario,
          fontTesto: this.fontSelezionato,
          ristoratore: { id: currentUser.id, login: currentUser.login },
        })
        .toPromise();

      const p1 = Array.from(this.portateSelezionate).map(p =>
        this.http.post('/api/portatas', { tipo: 'DEFAULT', nomeDefault: p, menu: { id: menu.id } }).toPromise(),
      );
      const p2 = this.portatePersonalizzate.map(n =>
        this.http.post('/api/portatas', { tipo: 'PERSONALIZZATA', nomePersonalizzato: n, menu: { id: menu.id } }).toPromise(),
      );
      await Promise.all([...p1, ...p2]);

      if (this.logoFile) {
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
              menu: { id: menu.id },
            })
            .toPromise();
          this.router.navigate(['/menu-view', menu.id]);
        };
      } else {
        this.router.navigate(['/menu-view', menu.id]);
      }
    } catch (err) {
      console.error('Errore:', err);
      this.isLoading = false;
    }
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
}
