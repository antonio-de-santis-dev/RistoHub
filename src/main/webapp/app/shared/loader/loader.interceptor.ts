import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';

import { LoaderService } from 'app/shared/loader/loader.service';

// Coppie [url, metodo] da skippare.
// - GET /api/account: controllo silenzioso di autenticazione all'avvio
// - GET /api/logout:  logout silenzioso post-scadenza sessione
// POST /api/authentication e POST /api/register NON sono skippati:
// il loader viene gestito direttamente da LoginComponent e RegisterComponent.
const LOADER_SKIP: Array<{ url: string; method: string }> = [
  { url: '/api/account', method: 'GET' },
  { url: '/api/logout', method: 'POST' },
];

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  private readonly loaderService = inject(LoaderService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const skip = LOADER_SKIP.some(rule => request.url.includes(rule.url) && request.method === rule.method);
    if (!skip) this.loaderService.show();
    return next.handle(request).pipe(
      finalize(() => {
        if (!skip) this.loaderService.hide();
      }),
    );
  }
}
