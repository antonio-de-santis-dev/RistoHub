import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ElementRef, Renderer2 } from '@angular/core';
import { isPlatformBrowser, AsyncPipe, NgIf } from '@angular/common';
import { DOCUMENT } from '@angular/common';

import { LoaderService } from './loader.service';

/**
 * Loader globale di RistoHub.
 *
 * PROBLEMA STACKING CONTEXT:
 * Alcune pagine (landing, login, menu-public) hanno :host { position: fixed; z-index: 900 }.
 * Questo crea uno stacking context isolato che può sovrapporsi al loader
 * anche se il loader ha z-index: 9999, perché il confronto avviene
 * tra stacking context diversi nella catena DOM.
 *
 * SOLUZIONE:
 * 1. Il loader viene spostato direttamente nel <body> via appendChild
 *    → esce da qualsiasi stacking context annidato di jhi-main.
 * 2. z-index: 2147483647 (massimo int a 32 bit) → sopra qualsiasi elemento.
 * 3. Nessun backdrop-filter → non dipende dallo stacking context del parent.
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

  loading$ = this.loaderService.loading$;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const el: HTMLElement = this.elementRef.nativeElement;

      // Sposta nel <body> per uscire da stacking context annidati
      this.document.body.appendChild(el);

      // Forza z-index massimo sull'host element direttamente
      // (il CSS :host potrebbe non applicarsi dopo il reparenting)
      this.renderer.setStyle(el, 'position', 'relative');
      this.renderer.setStyle(el, 'z-index', '2147483647');
    }
  }

  ngOnDestroy(): void {
    const el: HTMLElement = this.elementRef.nativeElement;
    if (el.parentNode === this.document.body) {
      this.document.body.removeChild(el);
    }
  }
}
