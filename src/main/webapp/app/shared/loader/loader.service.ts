import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private activeRequests = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // debounceTime(0): se hide() e show() arrivano nello stesso "zone turn" di Angular
  // (es. fine di una chiamata HTTP + inizio immediato di un'altra),
  // l'emissione di `false` viene soppressa — il loader rimane visibile senza flickering.
  // L'emissione finale di `false` (quando tutti i request sono davvero completi)
  // viene processata nel macrotask successivo, garantendo che Angular la veda sempre.
  loading$ = this.loadingSubject.pipe(debounceTime(0));

  show(): void {
    this.activeRequests++;
    if (this.activeRequests === 1) this.loadingSubject.next(true);
  }

  hide(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.activeRequests === 0) {
      this.loadingSubject.next(false);
    }
  }
}
