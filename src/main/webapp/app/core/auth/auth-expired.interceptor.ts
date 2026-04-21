import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { LoginService } from 'app/login/login.service';
import { StateStorageService } from 'app/core/auth/state-storage.service';

// URL che generano 401 per natura propria e NON devono mai triggerare
// il redirect a /login: api/account (check utente anonimo all'avvio),
// api/authentication (risposta a credenziali sbagliate).
const EXCLUDED_URLS = ['api/account', 'api/authentication', 'api/public'];

// Route già pubbliche/di autenticazione: se ci siamo già non ha senso
// salvarle come "URL precedente" e redirigere a /login.
const PUBLIC_ROUTES = ['/', '/login', '/account/register', '/account/activate', '/account/reset', '/menu-public'];

@Injectable()
export class AuthExpiredInterceptor implements HttpInterceptor {
  private readonly loginService = inject(LoginService);
  private readonly stateStorageService = inject(StateStorageService);
  private readonly router = inject(Router);

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap({
        error: (err: HttpErrorResponse) => {
          if (err.status !== 401 || !err.url) {
            return;
          }

          // Ignora le chiamate che producono 401 per natura:
          // api/account        → check iniziale utente anonimo (normale)
          // api/authentication → login fallito con credenziali errate (normale)
          // api/public         → endpoint pubblici del menu (clienti non registrati)
          const isExcluded = EXCLUDED_URLS.some(u => err.url!.includes(u));
          if (isExcluded) {
            return;
          }

          // Se è il logout, esci senza redirect
          if (err.url.includes(this.loginService.logoutUrl())) {
            this.loginService.logoutInClient();
            return;
          }

          // Sessione scaduta su una route protetta: salva l'URL corrente
          // solo se non è già una pagina pubblica/di autenticazione.
          // /menu-public/* è la pagina QR per i clienti → mai redirigere al login.
          const currentUrl = this.router.routerState.snapshot.url;
          const isPublicRoute = PUBLIC_ROUTES.some(r => currentUrl === r || currentUrl.startsWith(r + '/'));

          if (!isPublicRoute) {
            this.stateStorageService.storeUrl(currentUrl);
          }

          this.loginService.logout();
          this.router.navigate(['/login']);
        },
      }),
    );
  }
}
