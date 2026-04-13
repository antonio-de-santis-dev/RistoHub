import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ElementRef, Renderer2 } from '@angular/core';
import { isPlatformBrowser, AsyncPipe, NgIf } from '@angular/common';
import { DOCUMENT } from '@angular/common';

import { LoaderService } from './loader.service';

/**
 * Loader globale di RistoHub.
 *
 * STRATEGIA:
 * 1. body.appendChild(el) → esce da qualsiasi stacking context annidato di jhi-main.
 * 2. Il HOST stesso diventa position:fixed;inset:0 (via JS, dopo il reparenting).
 *    Questo è più affidabile di affidarsi al figlio position:fixed:
 *    - display:contents + figlio position:fixed ha comportamento ambiguo tra browser.
 *    - position:fixed sull'HOST (diretto figlio di body) è deterministico al 100%.
 * 3. Il figlio .rh-loader-overlay usa position:absolute;inset:0 → riempie l'host.
 * 4. pointer-events:none sull'host quando il loader è nascosto → nessuna interferenza.
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

      // 1. Sposta nel <body> — esce da tutti gli stacking context annidati
      this.document.body.appendChild(el);

      // 2. L'host stesso è l'overlay fixed: diretto figlio di body → ancora al viewport.
      //    Nessuna dipendenza da display:contents o da come il browser tratta
      //    position:fixed su un elemento figlio di un display:contents.
      this.renderer.setStyle(el, 'position', 'fixed');
      this.renderer.setStyle(el, 'inset', '0');
      this.renderer.setStyle(el, 'z-index', '2147483647');
      this.renderer.setStyle(el, 'pointer-events', 'none');
      this.renderer.setStyle(el, 'display', 'block');
    }
  }

  ngOnDestroy(): void {
    const el: HTMLElement = this.elementRef.nativeElement;
    if (el.parentNode === this.document.body) {
      this.document.body.removeChild(el);
    }
  }
}
