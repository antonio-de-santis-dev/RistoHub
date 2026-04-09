import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from 'app/shared/loader/loader.service';

@Component({
  selector: 'rh-loader-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader-preview.component.html',
  styleUrls: ['./loader-preview.component.scss'],
})
export class LoaderPreviewComponent implements OnDestroy {
  private readonly loaderService = inject(LoaderService);

  isActive = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Attiva il loader globale per N secondi */
  mostraLoader(secondi: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.loaderService.show();
    this.isActive = true;
    this.timer = setTimeout(() => {
      this.loaderService.hide();
      this.isActive = false;
      this.timer = null;
    }, secondi * 1000);
  }

  /** Ferma il loader prima del timeout */
  fermaLoader(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.loaderService.hide();
    this.isActive = false;
  }

  ngOnDestroy(): void {
    // Assicura che il loader venga spento se si naviga via
    if (this.isActive) {
      this.loaderService.hide();
    }
    if (this.timer) clearTimeout(this.timer);
  }
}
