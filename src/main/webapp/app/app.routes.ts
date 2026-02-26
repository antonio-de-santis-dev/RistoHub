import { Routes } from '@angular/router';

import { Authority } from 'app/config/authority.constants';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { errorRoute } from './layouts/error/error.route';

import { LandingComponent } from './landing/landing.component';
import { MenuWizardComponent } from './menu-wizard/menu-wizard.component';
import { MenuViewComponent } from './menu-view/menu-view.component';
import { MenuListComponent } from './menu-list/menu-list.component';
import { MenuWizardEditComponent } from './menu-wizard-edit/menu-wizard-edit.component';
import { ProdottoAddComponent } from './prodotto-add/prodotto-add.component';
import { PiattiGiornoGestioneComponent } from './piatti-giorno-gestione/piatti-giorno-gestione.component';
import { MenuCoverEditorComponent } from './menu-cover-editor/menu-cover-editor.component';

const routes: Routes = [
  // ── LANDING: prima pagina visibile senza login ──────────────────
  {
    path: '',
    component: LandingComponent,
    pathMatch: 'full',
  },

  // ── NAVBAR (outlet secondario, invariato) ────────────────────────
  {
    path: '',
    loadComponent: () => import('./layouts/navbar/navbar.component'),
    outlet: 'navbar',
  },

  // ── HOME (dopo login) ────────────────────────────────────────────
  {
    path: 'home',
    loadComponent: () => import('./home/home.component'),
    title: 'home.title',
  },

  // ── ADMIN ────────────────────────────────────────────────────────
  {
    path: 'admin',
    data: {
      authorities: [Authority.ADMIN],
    },
    canActivate: [UserRouteAccessService],
    loadChildren: () => import('./admin/admin.routes'),
  },

  // ── ACCOUNT / LOGIN ──────────────────────────────────────────────
  {
    path: 'account',
    loadChildren: () => import('./account/account.route'),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component'),
    title: 'login.title',
  },

  // ── ENTITÀ JHIPSTER ──────────────────────────────────────────────
  {
    path: '',
    loadChildren: () => import(`./entities/entity.routes`),
  },

  // ── MENU ─────────────────────────────────────────────────────────
  {
    path: 'menu-wizard',
    component: MenuWizardComponent,
  },
  {
    path: 'menu-view/:id',
    component: MenuViewComponent,
  },
  {
    path: 'menu-list',
    component: MenuListComponent,
  },
  {
    path: 'menu-wizard-edit/:id',
    component: MenuWizardEditComponent,
  },

  // ── PRODOTTI ─────────────────────────────────────────────────────
  {
    path: 'prodotto-add',
    component: ProdottoAddComponent,
  },
  {
    path: 'prodotto-add/:portataId',
    component: ProdottoAddComponent,
  },

  // ── PIATTI DEL GIORNO ────────────────────────────────────────────
  {
    path: 'piatti-giorno',
    component: PiattiGiornoGestioneComponent,
  },
  {
    path: 'menu-cover-editor/:id',
    component: MenuCoverEditorComponent,
    // Se hai AuthGuard, aggiungilo qui
  },

  ...errorRoute,
];

export default routes;
