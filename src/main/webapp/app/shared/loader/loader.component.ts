import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ElementRef } from '@angular/core';
import { isPlatformBrowser, AsyncPipe, NgIf } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';

import { LoaderService } from './loader.service';

/**
 * Il loader viene spostato direttamente nel <body> al momento del mount,
 * così il suo z-index: 9999 è nel root stacking context e non viene
 * oscurato da componenti con position:fixed (landing, login, register)
 * che creano stacking context isolati all'interno di jhi-main.
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
  private sub: Subscription | null = null;

  loading$ = this.loaderService.loading$;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Sposta l'host element direttamente nel <body> per uscire da
      // qualsiasi stacking context annidato creato da jhi-main o dai
      // componenti landing/login (position:fixed + z-index < 9999).
      this.document.body.appendChild(this.elementRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    // Rimuovi l'elemento dal body quando il componente viene distrutto
    const el: HTMLElement = this.elementRef.nativeElement;
    if (el.parentNode === this.document.body) {
      this.document.body.removeChild(el);
    }
  }
}
