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

// Rotte su cui il footer NON deve apparire
const ROUTES_WITHOUT_FOOTER = ['/menu-view', '/menu-public'];

// Rotte su cui la navbar NON deve apparire
const ROUTES_WITHOUT_NAVBAR = ['/menu-public'];

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

  showFooter = signal(true);
  showNavbar = signal(true);

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

    // Nascondi footer sulle rotte specificate
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
      const hide = ROUTES_WITHOUT_FOOTER.some(r => e.urlAfterRedirects.startsWith(r));
      this.showFooter.set(!hide);
      const hideNavbar = ROUTES_WITHOUT_NAVBAR.some(r => e.urlAfterRedirects.startsWith(r));
      this.showNavbar.set(!hideNavbar);
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
