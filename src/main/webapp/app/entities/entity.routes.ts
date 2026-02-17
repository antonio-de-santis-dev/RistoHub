import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'authority',
    data: { pageTitle: 'ristoHubApp.adminAuthority.home.title' },
    loadChildren: () => import('./admin/authority/authority.routes'),
  },
  {
    path: 'menu',
    data: { pageTitle: 'ristoHubApp.menu.home.title' },
    loadChildren: () => import('./menu/menu.routes'),
  },
  {
    path: 'portata',
    data: { pageTitle: 'ristoHubApp.portata.home.title' },
    loadChildren: () => import('./portata/portata.routes'),
  },
  {
    path: 'immagine-menu',
    data: { pageTitle: 'ristoHubApp.immagineMenu.home.title' },
    loadChildren: () => import('./immagine-menu/immagine-menu.routes'),
  },
  {
    path: 'prodotto',
    data: { pageTitle: 'ristoHubApp.prodotto.home.title' },
    loadChildren: () => import('./prodotto/prodotto.routes'),
  },
  {
    path: 'piatto-del-giorno',
    data: { pageTitle: 'ristoHubApp.piattoDelGiorno.home.title' },
    loadChildren: () => import('./piatto-del-giorno/piatto-del-giorno.routes'),
  },
  {
    path: 'allergene',
    data: { pageTitle: 'ristoHubApp.allergene.home.title' },
    loadChildren: () => import('./allergene/allergene.routes'),
  },
  /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
];

export default routes;
