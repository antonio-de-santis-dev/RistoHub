import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IImmagineMenu } from '../immagine-menu.model';
import { ImmagineMenuService } from '../service/immagine-menu.service';

const immagineMenuResolve = (route: ActivatedRouteSnapshot): Observable<null | IImmagineMenu> => {
  const id = route.params.id;
  if (id) {
    return inject(ImmagineMenuService)
      .find(id)
      .pipe(
        mergeMap((immagineMenu: HttpResponse<IImmagineMenu>) => {
          if (immagineMenu.body) {
            return of(immagineMenu.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default immagineMenuResolve;
