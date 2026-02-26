import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

export interface CopertinaImmagine {
  id?: string;
  // Dati dal DB (byte[] serializzato da Jackson come base64 string)
  immagine?: string;
  immagineContentType?: string;
  ordine: number;
  visibile: boolean;
  // Solo per nuovi file prima dell'upload
  file?: File;
  isNew?: boolean;
  uploading?: boolean;
  // data-URL per il tag <img>
  dataUrl?: string;
}

@Component({
  selector: 'jhi-menu-cover-editor',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-cover-editor.component.html',
  styleUrls: ['./menu-cover-editor.component.scss'],
})
export class MenuCoverEditorComponent implements OnInit {
  menuId: string | null = null;
  menuNome = '';
  immagini: CopertinaImmagine[] = [];
  isLoading = true;
  isSaving = false;

  draggingIndex: number | null = null;
  dragOverIndex: number | null = null;

  toastMsg: string | null = null;
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;

  eliminaIndex: number | null = null;
  confermaEliminaVisible = false;

  readonly MAX_IMMAGINI = 5;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.menuId = this.route.snapshot.paramMap.get('id');
    if (this.menuId) this.caricaDati();
  }

  async caricaDati(): Promise<void> {
    try {
      const menu: any = await this.http.get(`/api/menus/${this.menuId}`).toPromise();
      this.menuNome = menu.nome ?? 'Menu';

      const imgs: any[] = (await this.http.get<any[]>(`/api/menus/${this.menuId}/immagini`).toPromise()) ?? [];
      this.immagini = imgs
        .filter((img: any) => img.tipo === 'COPERTINA') // ← esclude LOGO e altri tipi
        .map((img: any, i: number) => ({
          id: img.id,
          immagine: img.immagine,
          immagineContentType: img.immagineContentType,
          ordine: img.ordine ?? i,
          visibile: img.visibile ?? true,
          dataUrl: img.immagine ? `data:${img.immagineContentType};base64,${img.immagine}` : undefined,
        }));
    } catch (err) {
      console.error('Errore caricamento:', err);
      this.mostraToast('❌ Errore nel caricamento delle immagini', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    const disponibili = this.MAX_IMMAGINI - this.immagini.length;
    if (disponibili <= 0) {
      this.mostraToast(`⚠️ Limite massimo di ${this.MAX_IMMAGINI} immagini raggiunto`, 'error');
      return;
    }
    files.slice(0, disponibili).forEach(f => this.aggiungiFile(f));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
    const files = Array.from(event.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
    const disponibili = this.MAX_IMMAGINI - this.immagini.length;
    files.slice(0, disponibili).forEach(f => this.aggiungiFile(f));
  }

  onDragOverZone(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }

  onDragLeaveZone(event: DragEvent): void {
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
  }

  private aggiungiFile(file: File): void {
    const reader = new FileReader();
    reader.onload = e => {
      this.immagini.push({
        ordine: this.immagini.length,
        visibile: true,
        file,
        isNew: true,
        dataUrl: e.target?.result as string,
        immagineContentType: file.type,
      });
    };
    reader.readAsDataURL(file);
  }

  toggleVisibile(img: CopertinaImmagine): void {
    img.visibile = !img.visibile;
  }

  chiediConfermaElimina(index: number): void {
    this.eliminaIndex = index;
    this.confermaEliminaVisible = true;
  }

  annullaElimina(): void {
    this.eliminaIndex = null;
    this.confermaEliminaVisible = false;
  }

  async confermaElimina(): Promise<void> {
    if (this.eliminaIndex === null) return;
    const img = this.immagini[this.eliminaIndex];

    if (img.id && !img.isNew) {
      try {
        await this.http.delete(`/api/menus/${this.menuId}/immagini-copertina/${img.id}`).toPromise();
      } catch (err) {
        console.error('Errore eliminazione server:', err);
        this.mostraToast("❌ Errore durante l'eliminazione. Riprova.", 'error');
        this.confermaEliminaVisible = false;
        this.eliminaIndex = null;
        return;
      }
    }

    this.immagini.splice(this.eliminaIndex, 1);
    this.ricalcolaOrdini();
    this.confermaEliminaVisible = false;
    this.eliminaIndex = null;
    this.mostraToast('🗑️ Immagine rimossa', 'success');
  }

  onDragStart(index: number): void {
    this.draggingIndex = index;
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverIndex = index;
  }

  onDragDrop(index: number): void {
    if (this.draggingIndex === null || this.draggingIndex === index) {
      this.draggingIndex = null;
      this.dragOverIndex = null;
      return;
    }
    const moved = this.immagini.splice(this.draggingIndex, 1)[0];
    this.immagini.splice(index, 0, moved);
    this.ricalcolaOrdini();
    this.draggingIndex = null;
    this.dragOverIndex = null;
  }

  onDragEnd(): void {
    this.draggingIndex = null;
    this.dragOverIndex = null;
  }

  sposta(index: number, direzione: -1 | 1): void {
    const newIndex = index + direzione;
    if (newIndex < 0 || newIndex >= this.immagini.length) return;
    [this.immagini[index], this.immagini[newIndex]] = [this.immagini[newIndex], this.immagini[index]];
    this.ricalcolaOrdini();
  }

  private ricalcolaOrdini(): void {
    this.immagini.forEach((img, i) => (img.ordine = i));
  }

  async salva(): Promise<void> {
    if (this.isSaving) return;
    this.isSaving = true;

    try {
      // 1. Upload immagini nuove (multipart → BLOB nel DB)
      for (const img of this.immagini.filter(i => i.isNew && i.file)) {
        img.uploading = true;
        const formData = new FormData();
        formData.append('file', img.file!);
        const risposta: any = await this.http.post(`/api/menus/${this.menuId}/immagini-copertina/upload`, formData).toPromise();
        img.id = risposta.id;
        img.immagine = risposta.immagine;
        img.immagineContentType = risposta.immagineContentType;
        img.dataUrl = risposta.immagine // ← aggiorna con i byte reali del server
          ? `data:${risposta.immagineContentType};base64,${risposta.immagine}`
          : img.dataUrl;
        img.isNew = false;
        img.file = undefined;
        img.uploading = false;
      }

      // 2. Aggiorna ordine e visibilità di tutte le immagini nel DB
      const payload = this.immagini
        .filter(img => img.id && !img.isNew)
        .map(img => ({ id: img.id, ordine: img.ordine, visibile: img.visibile }));

      if (payload.length > 0) {
        await this.http.put(`/api/menus/${this.menuId}/immagini-copertina`, payload).toPromise();
      }

      this.mostraToast('✅ Immagini salvate con successo', 'success');
    } catch (err) {
      console.error('Errore salvataggio:', err);
      this.mostraToast('❌ Errore durante il salvataggio. Riprova.', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  tornaAllaLista(): void {
    this.router.navigate(['/menu-list']);
  }

  get puoAggiungere(): boolean {
    return this.immagini.length < this.MAX_IMMAGINI;
  }

  get immaginiVisibili(): number {
    return this.immagini.filter(i => i.visibile).length;
  }

  private mostraToast(msg: string, tipo: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastType = tipo;
    this.toastTimer = setTimeout(() => (this.toastMsg = null), 3500);
  }
}
