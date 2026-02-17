import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import AllergeneResolve from './route/allergene-routing-resolve.service';

const allergeneRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/allergene.component').then(m => m.AllergeneComponent),
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/allergene-detail.component').then(m => m.AllergeneDetailComponent),
    resolve: {
      allergene: AllergeneResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/allergene-update.component').then(m => m.AllergeneUpdateComponent),
    resolve: {
      allergene: AllergeneResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/allergene-update.component').then(m => m.AllergeneUpdateComponent),
    resolve: {
      allergene: AllergeneResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default allergeneRoute;
