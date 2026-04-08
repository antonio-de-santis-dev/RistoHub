import { Component, OnInit, Renderer2, RendererFactory2, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { AccountService } from 'app/core/auth/account.service';
import { AppPageTitleStrategy } from 'app/app-page-title-strategy';
import FooterComponent from '../footer/footer.component';
import PageRibbonComponent from '../profiles/page-ribbon.component';
import { LoaderComponent } from 'app/shared/loader/loader.component';
import { routeAnimations } from 'app/route-animations';

// Allowlist delle rotte su cui footer e navbar devono APPARIRE.
// Tutto il resto (landing '/', /login, /account/register, /menu-public)
// NON li mostra. Default false elimina il flash visivo durante il caricamento
// iniziale di landing/login/register.
const ROUTES_WITH_FOOTER = [
  '/home',
  '/admin',
  '/account/password',
  '/account/settings',
  '/entities',
  '/menu-wizard',
  '/menu-list',
  '/menu-view',
  '/menu-wizard-edit',
  '/menu-cover-editor',
  '/prodotto-add',
  '/piatti-giorno',
  '/contatti',
];

const ROUTES_WITH_NAVBAR = [
  '/home',
  '/admin',
  '/account/password',
  '/account/settings',
  '/entities',
  '/menu-wizard',
  '/menu-list',
  '/menu-view',
  '/menu-wizard-edit',
  '/menu-cover-editor',
  '/prodotto-add',
  '/piatti-giorno',
  '/contatti',
];

/** Mappa path → nome stato per le animazioni */
const ROUTE_ANIMATION_STATE: Record<string, string> = {
  '': 'landing',
  login: 'login',
};

@Component({
  selector: 'jhi-main',
  templateUrl: './main.component.html',
  providers: [AppPageTitleStrategy],
  animations: [routeAnimations],
  imports: [RouterOutlet, FooterComponent, PageRibbonComponent, LoaderComponent],
})
export default class MainComponent implements OnInit {
  private readonly renderer: Renderer2;

  // Partono da false: nessun flash di footer/navbar durante il caricamento
  // di landing, login, register. Si attivano solo dopo NavigationEnd.
  showFooter = signal(false);
  showNavbar = signal(false);

  private readonly router = inject(Router);
  private readonly appPageTitleStrategy = inject(AppPageTitleStrategy);
  private readonly accountService = inject(AccountService);
  private readonly translateService = inject(TranslateService);
  private readonly rootRenderer = inject(RendererFactory2);

  constructor() {
    this.renderer = this.rootRenderer.createRenderer(document.querySelector('html'), null);
  }

  ngOnInit(): void {
    // try to log in automatically
    this.accountService.identity().subscribe();

    // Mostra footer e navbar solo sulle rotte in allowlist.
    // Usando un allowlist invece di una blocklist evitiamo il flash iniziale:
    // prima di NavigationEnd i signal restano false, nessun elemento appare.
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      const url = e.urlAfterRedirects;
      this.showFooter.set(ROUTES_WITH_FOOTER.some(r => url.startsWith(r)));
      this.showNavbar.set(ROUTES_WITH_NAVBAR.some(r => url.startsWith(r)));
    });

    this.translateService.onLangChange.subscribe((langChangeEvent: LangChangeEvent) => {
      this.appPageTitleStrategy.updateTitle(this.router.routerState.snapshot);
      dayjs.locale(langChangeEvent.lang);
      this.renderer.setAttribute(document.querySelector('html'), 'lang', langChangeEvent.lang);
    });
  }

  /**
   * Restituisce il nome dello stato di animazione per la route corrente.
   * Usato dal trigger [@routeAnimations] nel template.
   */
  getRouteAnimationData(outlet: RouterOutlet): string {
    if (!outlet?.isActivated) return '';
    const url = this.router.url.replace('/', '').split('?')[0];
    return ROUTE_ANIMATION_STATE[url] ?? 'other';
  }
}
