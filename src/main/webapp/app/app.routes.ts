import { Routes } from '@angular/router';

import { Authority } from 'app/config/authority.constants';
import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { errorRoute } from './layouts/error/error.route';

// OPT-02 FIX: rimossi tutti gli import statici dei componenti custom RistoHub.
// Ogni componente viene ora caricato con loadComponent() solo quando la route
// viene navigata per la prima volta. Angular emette un chunk JS separato per
// ognuno in fase di build (ng build --configuration production), riducendo il
// bundle iniziale e velocizzando il First Contentful Paint.

const routes: Routes = [
  // ── LANDING ─────────────────────────────────────────────────────
  // La landing è l'unica route che rimane eager: è la pagina radice ('/'),
  // viene caricata immediatamente all'avvio — non ha senso lazy-loadarla.
  {
    path: '',
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent),
    pathMatch: 'full',
  },

  // ── NAVBAR (outlet secondario) ───────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./layouts/navbar/navbar.component'),
    outlet: 'navbar',
  },

  // ── HOME ─────────────────────────────────────────────────────────
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.default),
    title: 'home.title',
  },

  // ── ADMIN ────────────────────────────────────────────────────────
  {
    path: 'admin',
    data: { authorities: [Authority.ADMIN] },
    canActivate: [UserRouteAccessService],
    loadChildren: () => import('./admin/admin.routes'),
  },

  // ── ACCOUNT / LOGIN ──────────────────────────────────────────────
  { path: 'account', loadChildren: () => import('./account/account.route') },
  { path: 'login', loadComponent: () => import('./login/login.component'), title: 'login.title' },

  // ── ENTITÀ JHIPSTER ──────────────────────────────────────────────
  { path: '', loadChildren: () => import('./entities/entity.routes') },

  // ── MENU PUBBLICO (QR Code – nessuna autenticazione richiesta) ───
  // NOTA: questa route deve stare PRIMA di menu-view/:id
  {
    path: 'menu-public/:id',
    loadComponent: () => import('./menu-public/menu-public.component').then(m => m.MenuPublicComponent),
    title: 'Menu',
  },

  // ── MENU ─────────────────────────────────────────────────────────
  {
    path: 'menu-wizard',
    loadComponent: () => import('./menu-wizard/menu-wizard.component').then(m => m.MenuWizardComponent),
  },
  {
    path: 'menu-view/:id',
    loadComponent: () => import('./menu-view/menu-view.component').then(m => m.MenuViewComponent),
  },
  {
    path: 'menu-list',
    loadComponent: () => import('./menu-list/menu-list.component').then(m => m.MenuListComponent),
  },
  {
    path: 'menu-wizard-edit/:id',
    loadComponent: () => import('./menu-wizard-edit/menu-wizard-edit.component').then(m => m.MenuWizardEditComponent),
  },
  {
    path: 'menu-cover-editor/:id',
    loadComponent: () => import('./menu-cover-editor/menu-cover-editor.component').then(m => m.MenuCoverEditorComponent),
  },

  // ── PRODOTTI ─────────────────────────────────────────────────────
  {
    path: 'prodotto-add',
    loadComponent: () => import('./prodotto-add/prodotto-add.component').then(m => m.ProdottoAddComponent),
  },
  {
    path: 'prodotto-add/:portataId',
    loadComponent: () => import('./prodotto-add/prodotto-add.component').then(m => m.ProdottoAddComponent),
  },

  // ── PIATTI DEL GIORNO ────────────────────────────────────────────
  {
    path: 'piatti-giorno',
    loadComponent: () => import('./piatti-giorno-gestione/piatti-giorno-gestione.component').then(m => m.PiattiGiornoGestioneComponent),
  },

  // ── CONTATTI ─────────────────────────────────────────────────────
  {
    path: 'contatti',
    loadComponent: () => import('./contatti-gestione/contatti-gestione.component').then(m => m.ContattiGestioneComponent),
  },

  // ── LOADER PREVIEW ───────────────────────────────────────────────
  // Pagina di anteprima e test del loader globale.
  // Solo utenti autenticati possono accedervi.
  {
    path: 'loader-preview',
    loadComponent: () => import('./loader-preview/loader-preview.component').then(m => m.LoaderPreviewComponent),
    canActivate: [UserRouteAccessService],
    title: 'Anteprima Loader',
  },

  ...errorRoute,
];

export default routes;
