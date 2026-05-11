import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuDTO, ImmagineMenuMetaDTO, PortataDTO } from '../shared/model/risto.model';

@Component({
  selector: 'app-menu-wizard-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-wizard-edit.component.html',
  styleUrls: ['./menu-wizard-edit.component.scss'],
})
export class MenuWizardEditComponent implements OnInit {
  @Input() menu?: MenuDTO;
  @Output() menuSaved = new EventEmitter<MenuDTO>();

  selectedTemplate: TemplateStyle | null = null;
  colorePrimario: string = '#C8102E';
  coloreSecondario: string = '#F5E6C8';
  fontSelezionato: string = 'Playfair Display';
  fonts: string[] = ['Playfair Display', 'Georgia', 'Times New Roman', 'Arial', 'Helvetica', 'Roboto', 'Open Sans'];
  templates: TemplateStyle[] = ['MODERNO', 'RUSTICO', 'CLASSICO'];
  logoEsistenteUrl?: string;

  ngOnInit(): void {
    if (this.menu) {
      this.selectedTemplate = this.menu.templateStyle ?? null;
      this.colorePrimario = this.menu.colorePrimario ?? '#C8102E';
      this.coloreSecondario = this.menu.coloreSecondario ?? '#F5E6C8';
      this.fontSelezionato = this.menu.fontMenu ?? 'Playfair Display';

      // Carica il logo esistente
      const logo = this.menu.immagini?.find(img => img.tipo === 'LOGO');
      if (logo?.immagine && logo.immagineContentType) {
        this.logoEsistenteUrl = `data:${logo.immagineContentType};base64,${logo.immagine}`;
      }
    }
  }

  onTemplateSelect(template: TemplateStyle): void {
    this.selectedTemplate = template;
  }

  onColorChange(color: string, type: 'primario' | 'secondario'): void {
    if (type === 'primario') {
      this.colorePrimario = color;
    } else {
      this.coloreSecondario = color;
    }
  }

  onFontSelect(font: string): void {
    this.fontSelezionato = font;
  }

  save(): void {
    if (!this.menu) return;

    const updatedMenu: MenuDTO = {
      ...this.menu,
      templateStyle: this.selectedTemplate,
      colorePrimario: this.colorePrimario,
      coloreSecondario: this.coloreSecondario,
      fontMenu: this.fontSelezionato,
    };

    this.menuSaved.emit(updatedMenu);
  }
}
