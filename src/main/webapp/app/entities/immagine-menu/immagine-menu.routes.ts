import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import ImmagineMenuResolve from './route/immagine-menu-routing-resolve.service';

const immagineMenuRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/immagine-menu.component').then(m => m.ImmagineMenuComponent),
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/immagine-menu-detail.component').then(m => m.ImmagineMenuDetailComponent),
    resolve: {
      immagineMenu: ImmagineMenuResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/immagine-menu-update.component').then(m => m.ImmagineMenuUpdateComponent),
    resolve: {
      immagineMenu: ImmagineMenuResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/immagine-menu-update.component').then(m => m.ImmagineMenuUpdateComponent),
    resolve: {
      immagineMenu: ImmagineMenuResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default immagineMenuRoute;
