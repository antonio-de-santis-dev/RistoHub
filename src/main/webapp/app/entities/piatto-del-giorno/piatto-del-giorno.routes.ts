import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import PiattoDelGiornoResolve from './route/piatto-del-giorno-routing-resolve.service';

const piattoDelGiornoRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/piatto-del-giorno.component').then(m => m.PiattoDelGiornoComponent),
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/piatto-del-giorno-detail.component').then(m => m.PiattoDelGiornoDetailComponent),
    resolve: {
      piattoDelGiorno: PiattoDelGiornoResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/piatto-del-giorno-update.component').then(m => m.PiattoDelGiornoUpdateComponent),
    resolve: {
      piattoDelGiorno: PiattoDelGiornoResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/piatto-del-giorno-update.component').then(m => m.PiattoDelGiornoUpdateComponent),
    resolve: {
      piattoDelGiorno: PiattoDelGiornoResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default piattoDelGiornoRoute;
