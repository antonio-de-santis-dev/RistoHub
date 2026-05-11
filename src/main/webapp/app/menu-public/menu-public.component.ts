import { Component, OnInit, Input, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MenuDTO,
  PiattoDelGiornoDTO,
  AllergeneDTO,
  ImmagineMenuMetaDTO,
  PortataConProdottiDTO,
  ListaContattiDTO,
  ContattoItemDTO,
} from '../shared/model/risto.model';
import { TraduzioneService } from '../core/services/traduzione.service';

@Component({
  selector: 'app-menu-public',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-public.component.html',
  styleUrls: ['./menu-public.component.scss'],
})
export class MenuPublicComponent implements OnInit, OnChanges {
  @Input() menu?: MenuDTO;
  @Input() lingua: string = 'it';

  piattiDelGiorno: PiattoDelGiornoDTO[] = [];
  allergeni: AllergeneDTO[] = [];
  allergeniByNome: Map<string, AllergeneDTO> = new Map();
  modernoImmagini: ImmagineMenuMetaDTO[] = [];
  rusticoImmagini: ImmagineMenuMetaDTO[] = [];
  currentImageIndex: number = 0;
  currentRusticoImageIndex: number = 0;
  autoplayInterval?: any;
  autoplayRusticoInterval?: any;

  constructor(private traduzioneService: TraduzioneService) {}

  ngOnInit(): void {
    this.loadAllergeni();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['menu']) {
      this.loadMenuData();
    }
    if (changes['lingua']) {
      this.updateTraduzioni();
    }
  }

  loadMenuData(): void {
    if (!this.menu) return;

    // Carica piatti del giorno (esempio: da sostituire con chiamata API)
    this.piattiDelGiorno =
      this.menu.portate?.flatMap(
        portata =>
          portata.prodotti?.map(prodotto => ({
            id: prodotto.id,
            nome: prodotto.nome,
            descrizione: prodotto.descrizione,
            prezzo: prodotto.prezzo,
            menu: this.menu,
            prodotto: prodotto,
          })) ?? [],
      ) ?? [];

    // Filtra immagini per template
    this.modernoImmagini = this.menu.immagini?.filter(img => img.tipo === 'COPERTINA' && img.visibile !== false) ?? [];
    this.rusticoImmagini = this.menu.immagini?.filter(img => img.tipo === 'SFONDO' && img.visibile !== false) ?? [];

    this.startAutoplay();
  }

  loadAllergeni(): void {
    // Esempio: Carica allergeni dal backend
    this.allergeni = [
      { id: 1, nome: 'Glutine', icona: '🌾', colore: '#FFD700' },
      { id: 2, nome: 'Crostacei', icona: '🦐', colore: '#FF6347' },
      { id: 3, nome: 'Uova', icona: '🥚', colore: '#FF4500' },
      { id: 4, nome: 'Pesce', icona: '🐟', colore: '#4682B4' },
      { id: 5, nome: 'Arachidi', icona: '🥜', colore: '#8B4513' },
      { id: 6, nome: 'Soia', icona: '🌱', colore: '#228B22' },
      { id: 7, nome: 'Latte', icona: '🥛', colore: '#F5F5DC' },
      { id: 8, nome: 'Noci', icona: '🌰', colore: '#8B4513' },
      { id: 9, nome: 'Sedano', icona: '🥬', colore: '#228B22' },
      { id: 10, nome: 'Senape', icona: '🟡', colore: '#FFD700' },
      { id: 11, nome: 'Sesamo', icona: '🌿', colore: '#2E8B57' },
      { id: 12, nome: 'Lupino', icona: '🌸', colore: '#9370DB' },
      { id: 13, nome: 'Molluschi', icona: '🐚', colore: '#483D8B' },
      { id: 14, nome: 'Anidride solforosa', icona: '⚗️', colore: '#DC143C' },
    ];

    this.allergeniByNome = new Map(this.allergeni.map(a => [a.nome?.toLowerCase().trim() ?? '', a]));
  }

  updateTraduzioni(): void {
    if (!this.menu || !this.piattiDelGiorno) return;
    // Logica per aggiornare le traduzioni (da implementare)
  }

  getT(testo?: string): string {
    if (!testo) return '';
    // Logica per tradurre il testo (da implementare con TraduzioneService)
    return testo;
  }

  formatPrezzo(prezzo?: number): string {
    if (prezzo === undefined || prezzo === null) return '€ 0,00';
    return `€ ${prezzo.toFixed(2).replace('.', ',')}`;
  }

  getAllergeneIcona(allergene: AllergeneDTO): string | undefined {
    return allergene.icona;
  }

  getNomePiatto(piatto: PiattoDelGiornoDTO): string {
    return this.getT(piatto.prodotto?.nome ?? piatto.nome ?? '');
  }

  getDescrizionePiatto(piatto: PiattoDelGiornoDTO): string {
    return this.getT(piatto.prodotto?.descrizione ?? piatto.descrizione ?? '');
  }

  getPrezzoPiatto(piatto: PiattoDelGiornoDTO): number {
    return piatto.prodotto?.prezzo ?? piatto.prezzo ?? 0;
  }

  getMenuNome(): string {
    return this.menu?.nome ?? '';
  }

  getColorePrimario(): string {
    return this.menu?.colorePrimario ?? '#8b1a1a';
  }

  getColoreSecondario(): string {
    return this.menu?.coloreSecondario ?? '#e8c832';
  }

  getFontMenu(): string {
    return this.menu?.fontMenu ?? 'Playfair Display';
  }

  isModerno(): boolean {
    return this.menu?.templateStyle === 'MODERNO';
  }

  isRustico(): boolean {
    return this.menu?.templateStyle === 'RUSTICO';
  }

  startAutoplay(): void {
    this.stopAutoplay();
    if (this.isModerno() && this.modernoImmagini.length > 0) {
      this.autoplayInterval = setInterval(() => {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.modernoImmagini.length;
      }, 5000);
    }
    if (this.isRustico() && this.rusticoImmagini.length > 0) {
      this.autoplayRusticoInterval = setInterval(() => {
        this.currentRusticoImageIndex = (this.currentRusticoImageIndex + 1) % this.rusticoImmagini.length;
      }, 5000);
    }
  }

  stopAutoplay(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = undefined;
    }
    if (this.autoplayRusticoInterval) {
      clearInterval(this.autoplayRusticoInterval);
      this.autoplayRusticoInterval = undefined;
    }
  }

  togglePortata(portata: PortataConProdottiDTO): void {
    portata.aperta = !portata.aperta;
  }

  getContattiLista(lista: ListaContattiDTO): ContattoItemDTO[] {
    return lista.items ?? [];
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }
}
