import { Routes } from '@angular/router';

import { Authority } from 'app/config/authority.constants';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { errorRoute } from './layouts/error/error.route';

import { MenuWizardComponent } from './menu-wizard/menu-wizard.component';
import { MenuViewComponent } from './menu-view/menu-view.component';
import { MenuListComponent } from './menu-list/menu-list.component';
import { MenuWizardEditComponent } from './menu-wizard-edit/menu-wizard-edit.component';
import { ProdottoAddComponent } from './prodotto-add/prodotto-add.component';
import { PiattiGiornoGestioneComponent } from './piatti-giorno-gestione/piatti-giorno-gestione.component';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component'),
    title: 'home.title',
  },
  {
    path: '',
    loadComponent: () => import('./layouts/navbar/navbar.component'),
    outlet: 'navbar',
  },
  {
    path: 'admin',
    data: {
      authorities: [Authority.ADMIN],
    },
    canActivate: [UserRouteAccessService],
    loadChildren: () => import('./admin/admin.routes'),
  },
  {
    path: 'account',
    loadChildren: () => import('./account/account.route'),
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component'),
    title: 'login.title',
  },
  {
    path: '',
    loadChildren: () => import(`./entities/entity.routes`),
  },
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
  {
    path: 'prodotto-add',
    component: ProdottoAddComponent,
  },
  {
    path: 'prodotto-add/:portataId',
    component: ProdottoAddComponent,
  },
  {
    path: 'piatti-giorno',
    component: PiattiGiornoGestioneComponent,
  },

  ...errorRoute,
];

export default routes;
