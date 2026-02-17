import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import PortataResolve from './route/portata-routing-resolve.service';

const portataRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/portata.component').then(m => m.PortataComponent),
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/portata-detail.component').then(m => m.PortataDetailComponent),
    resolve: {
      portata: PortataResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/portata-update.component').then(m => m.PortataUpdateComponent),
    resolve: {
      portata: PortataResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/portata-update.component').then(m => m.PortataUpdateComponent),
    resolve: {
      portata: PortataResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default portataRoute;
