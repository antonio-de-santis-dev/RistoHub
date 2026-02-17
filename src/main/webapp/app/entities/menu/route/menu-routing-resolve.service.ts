import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IMenu } from '../menu.model';
import { MenuService } from '../service/menu.service';

const menuResolve = (route: ActivatedRouteSnapshot): Observable<null | IMenu> => {
  const id = route.params.id;
  if (id) {
    return inject(MenuService)
      .find(id)
      .pipe(
        mergeMap((menu: HttpResponse<IMenu>) => {
          if (menu.body) {
            return of(menu.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default menuResolve;
