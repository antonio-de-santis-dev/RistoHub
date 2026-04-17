import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MenuDTO } from 'app/shared/model/risto.model';

interface ProdottoImport {
  nome: string;
  descrizione: string;
  prezzo: string;
}

interface PortataImport {
  nomePortata: string;
  prodotti: ProdottoImport[];
}

interface PdfImportResult {
  portate: PortataImport[];
  totaleProdotti: number;
  avvisi: string[];
}

type Fase = 'selezione' | 'anteprima' | 'successo' | 'errore';

@Component({
  selector: 'jhi-import-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './import-menu.component.html',
  styleUrls: ['./import-menu.component.scss'],
})
export class ImportMenuComponent implements OnInit {
  // ── Stato navigazione ─────────────────────────────────────────────────────
  fase: Fase = 'selezione';
  isLoading = false;
  errorMessage: string | null = null;

  // ── Dati menu ─────────────────────────────────────────────────────────────
  menus: MenuDTO[] = [];
  menuSelezionatoId: string | null = null;

  // ── File PDF ──────────────────────────────────────────────────────────────
  filePdf: File | null = null;
  nomeFile = '';
  dragOver = false;

  // ── Anteprima parsing ─────────────────────────────────────────────────────
  anteprima: PdfImportResult | null = null;
  isConfirming = false;

  // ── Risultato finale ──────────────────────────────────────────────────────
  risultatoFinale: PdfImportResult | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.caricaMenus();
  }

  private async caricaMenus(): Promise<void> {
    try {
      this.menus = await firstValueFrom(this.http.get<MenuDTO[]>('/api/menus'));
    } catch {
      this.errorMessage = 'Impossibile caricare i menu. Riprova più tardi.';
    }
  }

  // ── Gestione file drag & drop / click ────────────────────────────────────

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(): void {
    this.dragOver = false;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.impostaFile(file);
  }

  onFileChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.impostaFile(file);
  }

  private impostaFile(file: File): void {
    if (file.type !== 'application/pdf') {
      this.errorMessage = 'Il file deve essere in formato PDF.';
      return;
    }
    this.filePdf = file;
    this.nomeFile = file.name;
    this.errorMessage = null;
  }

  rimuoviFile(): void {
    this.filePdf = null;
    this.nomeFile = '';
  }

  get prontoPrAnteprima(): boolean {
    return !!this.menuSelezionatoId && !!this.filePdf;
  }

  // ── Step 1: anteprima ────────────────────────────────────────────────────

  async analizza(): Promise<void> {
    if (!this.filePdf || !this.menuSelezionatoId) return;

    this.isLoading = true;
    this.errorMessage = null;

    const formData = new FormData();
    formData.append('file', this.filePdf);

    try {
      this.anteprima = await firstValueFrom(
        this.http.post<PdfImportResult>(`/api/menus/${this.menuSelezionatoId}/import-pdf/preview`, formData),
      );
      this.fase = 'anteprima';
    } catch {
      this.errorMessage = "Errore durante l'analisi del PDF. Verifica che il file segua il formato corretto.";
    } finally {
      this.isLoading = false;
    }
  }

  tornaASelezione(): void {
    this.fase = 'selezione';
    this.anteprima = null;
    this.errorMessage = null;
  }

  // ── Step 2: conferma importazione ─────────────────────────────────────────

  async confermImportazione(): Promise<void> {
    if (!this.filePdf || !this.menuSelezionatoId) return;

    this.isConfirming = true;
    this.errorMessage = null;

    const formData = new FormData();
    formData.append('file', this.filePdf);

    try {
      this.risultatoFinale = await firstValueFrom(
        this.http.post<PdfImportResult>(`/api/menus/${this.menuSelezionatoId}/import-pdf/confirm`, formData),
      );
      this.fase = 'successo';
    } catch {
      this.errorMessage = "Errore durante l'importazione. Riprova o contatta il supporto.";
      this.fase = 'errore';
    } finally {
      this.isConfirming = false;
    }
  }

  // ── Navigazione post-successo ─────────────────────────────────────────────

  vaiAlMenu(): void {
    this.router.navigate(['/menu-view', this.menuSelezionatoId]);
  }

  nuovaImportazione(): void {
    this.fase = 'selezione';
    this.filePdf = null;
    this.nomeFile = '';
    this.anteprima = null;
    this.risultatoFinale = null;
    this.errorMessage = null;
  }

  tornaAiMieiMenu(): void {
    this.router.navigate(['/menu-list']);
  }

  get nomeMenuSelezionato(): string {
    return this.menus.find(m => m.id === this.menuSelezionatoId)?.nome ?? '';
  }

  totProdottiAnteprima(): number {
    if (!this.anteprima) return 0;
    return this.anteprima.portate.reduce((acc, p) => acc + p.prodotti.length, 0);
  }
}
