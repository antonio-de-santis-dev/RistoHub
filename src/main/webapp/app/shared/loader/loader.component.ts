import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ElementRef, Renderer2 } from '@angular/core';
import { isPlatformBrowser, AsyncPipe, NgIf } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { LoaderService } from './loader.service';

/**
 * Loader globale di RistoHub.
 *
 * Strategia:
 * 1. body.appendChild → esce dagli stacking context delle route animate.
 * 2. :host { display: contents } → l'host non genera box, non è un containing block.
 * 3. .rh-loader-overlay { position: fixed; inset: 0; z-index: 2147483647 }
 *    → il fixed si ancora al viewport (nessun antenato con transform sul body).
 *
 * NON si imposta position né z-index sull'host via JS:
 * qualsiasi position su un display:contents element ha comportamento undefined
 * e in Chrome/Firefox converte l'elemento in block, rompendo il fixed del figlio.
 */
@Component({
  selector: 'rh-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  imports: [AsyncPipe, NgIf],
})
export class LoaderComponent implements OnInit, OnDestroy {
  private readonly loaderService = inject(LoaderService);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  readonly loading$ = this.loaderService.loading$;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const el: HTMLElement = this.elementRef.nativeElement;
      // Sposta nel <body>: esce da qualsiasi stacking context annidato.
      // Non si tocca position né z-index sull'host — display:contents
      // garantisce che il figlio fixed si ancori al viewport.
      this.document.body.appendChild(el);
    }
  }

  ngOnDestroy(): void {
    const el: HTMLElement = this.elementRef.nativeElement;
    if (el.parentNode === this.document.body) {
      this.document.body.removeChild(el);
    }
  }
}
