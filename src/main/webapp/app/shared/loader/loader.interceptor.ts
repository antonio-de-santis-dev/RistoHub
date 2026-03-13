import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, finalize } from 'rxjs';

import { LoaderService } from 'app/shared/loader/loader.service';

// Endpoint che NON devono attivare il loader globale:
// - /api/account: controllo silenzioso all'avvio e sul login, invisibile all'utente
// - /api/authentication: il submit del form di login usa feedback inline, non lo spinner globale
const LOADER_SKIP_URLS = ['/api/account', '/api/authentication'];

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {
  private readonly loaderService = inject(LoaderService);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const skip = LOADER_SKIP_URLS.some(url => request.url.includes(url));
    if (!skip) this.loaderService.show();
    return next.handle(request).pipe(
      finalize(() => {
        if (!skip) this.loaderService.hide();
      }),
    );
  }
}
