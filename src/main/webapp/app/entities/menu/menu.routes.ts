import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import MenuResolve from './route/menu-routing-resolve.service';

const menuRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/menu.component').then(m => m.MenuComponent),
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/menu-detail.component').then(m => m.MenuDetailComponent),
    resolve: {
      menu: MenuResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/menu-update.component').then(m => m.MenuUpdateComponent),
    resolve: {
      menu: MenuResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/menu-update.component').then(m => m.MenuUpdateComponent),
    resolve: {
      menu: MenuResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default menuRoute;
