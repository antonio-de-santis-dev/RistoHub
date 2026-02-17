import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import ProdottoResolve from './route/prodotto-routing-resolve.service';

const prodottoRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/prodotto.component').then(m => m.ProdottoComponent),
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/prodotto-detail.component').then(m => m.ProdottoDetailComponent),
    resolve: {
      prodotto: ProdottoResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/prodotto-update.component').then(m => m.ProdottoUpdateComponent),
    resolve: {
      prodotto: ProdottoResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/prodotto-update.component').then(m => m.ProdottoUpdateComponent),
    resolve: {
      prodotto: ProdottoResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default prodottoRoute;
