import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImmagineMenuMetaDTO, MenuDTO } from '../shared/model/risto.model';

@Component({
  selector: 'app-menu-cover-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-cover-editor.component.html',
  styleUrls: ['./menu-cover-editor.component.scss'],
})
export class MenuCoverEditorComponent implements OnInit {
  @Input() menu?: MenuDTO;
  @Output() coverSaved = new EventEmitter<ImmagineMenuMetaDTO[]>();

  immagini: { id?: number; dataUrl?: string; tipo: string; ordine: number }[] = [];
  selectedFile?: File;
  selectedTipo: string = 'COPERTINA';

  ngOnInit(): void {
    this.loadExistingImages();
  }

  loadExistingImages(): void {
    if (!this.menu?.immagini) return;

    this.immagini = this.menu.immagini.map(img => ({
      id: img.id,
      dataUrl: img.immagine && img.immagineContentType ? `data:${img.immagineContentType};base64,${img.immagine}` : undefined,
      tipo: img.tipo ?? 'COPERTINA',
      ordine: img.ordine ?? 0,
    }));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const newImage = {
          dataUrl: reader.result as string,
          tipo: this.selectedTipo,
          ordine: this.immagini.length,
        };
        this.immagini.push(newImage);
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeImage(index: number): void {
    this.immagini.splice(index, 1);
  }

  moveUp(index: number): void {
    if (index > 0) {
      const temp = this.immagini[index];
      this.immagini[index] = this.immagini[index - 1];
      this.immagini[index - 1] = temp;
    }
  }

  moveDown(index: number): void {
    if (index < this.immagini.length - 1) {
      const temp = this.immagini[index];
      this.immagini[index] = this.immagini[index + 1];
      this.immagini[index + 1] = temp;
    }
  }

  save(): void {
    if (!this.menu) return;

    const immaginiToSave: ImmagineMenuMetaDTO[] = this.immagini.map((img, index) => {
      // Se c'è un dataUrl, estrai base64 e contentType
      if (img.dataUrl) {
        const parts = img.dataUrl.split(',');
        const contentType = parts[0].split(':')[1].split(';')[0];
        const base64 = parts[1];
        return {
          id: img.id,
          tipo: img.tipo as 'COPERTINA' | 'LOGO' | 'SFONDO' | 'ALTRO',
          immagine: base64,
          immagineContentType: contentType,
          ordine: index,
          visibile: true,
          menu: this.menu,
        };
      }
      // Altrimenti, usa i dati esistenti
      const existingImg = this.menu.immagini?.find(i => i.id === img.id);
      return {
        ...existingImg,
        tipo: img.tipo as 'COPERTINA' | 'LOGO' | 'SFONDO' | 'ALTRO',
        ordine: index,
      };
    });

    this.coverSaved.emit(immaginiToSave);
  }
}
