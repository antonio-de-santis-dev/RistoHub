import { Component, OnInit, Renderer2, RendererFactory2, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import dayjs from 'dayjs/esm';

import { AccountService } from 'app/core/auth/account.service';
import { AppPageTitleStrategy } from 'app/app-page-title-strategy';
import FooterComponent from '../footer/footer.component';
import PageRibbonComponent from '../profiles/page-ribbon.component';

@Component({
  selector: 'jhi-main',
  templateUrl: './main.component.html',
  providers: [AppPageTitleStrategy],
  imports: [RouterOutlet, FooterComponent, PageRibbonComponent, CommonModule],
})
export default class MainComponent implements OnInit {
  private readonly renderer: Renderer2;

  showNavbar = true;
  showFooter = true;

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

    // Nascondi navbar sulle route pubbliche (QR code)
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url = e.urlAfterRedirects;
      this.showNavbar = !url.startsWith('/menu-public/');
      this.showFooter = !url.startsWith('/menu-public/') && !url.startsWith('/menu-view/');
    });

    this.translateService.onLangChange.subscribe((langChangeEvent: LangChangeEvent) => {
      this.appPageTitleStrategy.updateTitle(this.router.routerState.snapshot);
      dayjs.locale(langChangeEvent.lang);
      this.renderer.setAttribute(document.querySelector('html'), 'lang', langChangeEvent.lang);
    });
  }
}
