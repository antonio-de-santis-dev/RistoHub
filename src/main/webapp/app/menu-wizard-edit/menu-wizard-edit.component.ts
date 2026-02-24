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
  // ← FIX: id ora è stringa ('CLASSICO', 'MODERNO', 'RUSTICO') come nel wizard creazione
  selectedTemplate: string | null = null;
  templates = [
    { id: 'CLASSICO', nome: 'Classico', descrizione: 'Elegante e tradizionale, con bordi decorativi e layout centrato', icona: '🍷' },
    { id: 'MODERNO', nome: 'Moderno', descrizione: 'Minimalista e pulito, con carosello immagini e tab scorrevoli', icona: '⚡' },
    { id: 'RUSTICO', nome: 'Rustico', descrizione: 'Caldo e accogliente, ispirato alla trattoria italiana', icona: '🌿' },
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
      // ← FIX: legge templateStyle (non stileTemplate)
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

  async salvaModifiche(): Promise<void> {
    if (!this.validaStep() || !this.menuId) return;
    this.isLoading = true;
    try {
      const currentUser: any = await this.http.get('/api/account').toPromise();

      // 1. Aggiorna il menu con PATCH (partialUpdate) invece di PUT.
      //    PUT costruisce entita con portatas=[] -> JPA orphanRemoval cancella tutto.
      //    PATCH aggiorna solo i campi del DTO senza toccare portatas/prodotti.
      await this.http
        .patch(`/api/menus/${this.menuId}`, {
          id: this.menuId,
          nome: this.nomeMenu,
          descrizione: this.descrizioneMenu,
          attivo: true,
          templateStyle: this.selectedTemplate,
          colorePrimario: this.colorePrimario,
          coloreSecondario: this.coloreSecondario,
          fontMenu: this.fontSelezionato,
          ristoratore: { id: currentUser.id, login: currentUser.login },
        })
        .toPromise();

      // 2. Aggiorna portate con DIFF sicuro.
      //    REGOLA FONDAMENTALE: una portata viene eliminata SOLO se è vuota (0 prodotti).
      //    Se ha prodotti, viene mantenuta anche se l'utente l'ha deselezionata —
      //    questo previene la perdita di dati per cascade delete.

      // Normalizza il tipo: il backend potrebbe restituire 'DEFAULT' o 'default'
      const tipoDefault = (t: string) => t?.toUpperCase() === 'DEFAULT';
      const tipoCustom = (t: string) => t?.toUpperCase() === 'PERSONALIZZATA';

      // ── DEFAULT: portate da eliminare ──
      const portateDefaultDaEliminare = this.portateEsistentiIds.filter(
        p => tipoDefault(p.tipo) && p.nomeDefault && !this.portateSelezionate.has(p.nomeDefault),
      );
      for (const p of portateDefaultDaEliminare) {
        // GUARD: elimina solo se la portata è vuota
        const prodotti: any[] = (await this.http.get<any[]>(`/api/prodottos/by-portata/${p.id}`).toPromise()) ?? [];
        if (prodotti.length === 0) {
          await this.http.delete(`/api/portatas/${p.id}`).toPromise();
        }
        // Se ha prodotti: la portata viene mantenuta silenziosamente
      }

      // ── DEFAULT: portate da creare ──
      const nomiDefaultEsistenti = new Set(
        this.portateEsistentiIds.filter(p => tipoDefault(p.tipo) && p.nomeDefault).map(p => p.nomeDefault!),
      );
      const portateDefaultDaCreare = Array.from(this.portateSelezionate).filter(nome => !nomiDefaultEsistenti.has(nome));
      for (const nome of portateDefaultDaCreare) {
        await this.http.post('/api/portatas', { tipo: 'DEFAULT', nomeDefault: nome, menu: { id: this.menuId } }).toPromise();
      }

      // ── PERSONALIZZATA: portate da eliminare ──
      const portateCustomDaEliminare = this.portateEsistentiIds.filter(
        p => tipoCustom(p.tipo) && p.nomePersonalizzato && !this.portatePersonalizzate.includes(p.nomePersonalizzato),
      );
      for (const p of portateCustomDaEliminare) {
        // GUARD: elimina solo se la portata è vuota
        const prodotti: any[] = (await this.http.get<any[]>(`/api/prodottos/by-portata/${p.id}`).toPromise()) ?? [];
        if (prodotti.length === 0) {
          await this.http.delete(`/api/portatas/${p.id}`).toPromise();
        }
      }

      // ── PERSONALIZZATA: portate da creare ──
      const nomiCustomEsistenti = new Set(
        this.portateEsistentiIds.filter(p => tipoCustom(p.tipo) && p.nomePersonalizzato).map(p => p.nomePersonalizzato!),
      );
      const portateCustomDaCreare = this.portatePersonalizzate.filter(nome => !nomiCustomEsistenti.has(nome));
      for (const nome of portateCustomDaCreare) {
        await this.http.post('/api/portatas', { tipo: 'PERSONALIZZATA', nomePersonalizzato: nome, menu: { id: this.menuId } }).toPromise();
      }

      // 3. Gestione logo — elimina TUTTI i loghi esistenti prima di salvarne uno nuovo
      //    (fix: evita loghi duplicati da salvataggi precedenti falliti)
      if (this.logoFile) {
        // Ricarica la lista aggiornata e cancella TUTTI i loghi del menu
        const immaginiAttuali: any[] = (await this.http.get<any[]>(`/api/menus/${this.menuId}/immagini`).toPromise()) ?? [];
        const tuttiILoghi = immaginiAttuali.filter(i => i.tipo === 'LOGO');
        for (const logo of tuttiILoghi) {
          try {
            await this.http.delete(`/api/immagine-menus/${logo.id}`).toPromise();
          } catch (e) {
            console.warn('Impossibile eliminare logo', logo.id, e);
          }
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
        // Caso "rimuovi logo senza sostituirlo" — elimina tutti i loghi
        const immaginiAttuali: any[] = (await this.http.get<any[]>(`/api/menus/${this.menuId}/immagini`).toPromise()) ?? [];
        const tuttiILoghi = immaginiAttuali.filter(i => i.tipo === 'LOGO');
        for (const logo of tuttiILoghi) {
          try {
            await this.http.delete(`/api/immagine-menus/${logo.id}`).toPromise();
          } catch (e) {
            console.warn('Impossibile eliminare logo', logo.id, e);
          }
        }
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
