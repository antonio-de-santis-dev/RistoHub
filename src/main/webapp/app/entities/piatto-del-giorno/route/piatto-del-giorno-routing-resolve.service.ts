import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IPiattoDelGiorno } from '../piatto-del-giorno.model';
import { PiattoDelGiornoService } from '../service/piatto-del-giorno.service';

const piattoDelGiornoResolve = (route: ActivatedRouteSnapshot): Observable<null | IPiattoDelGiorno> => {
  const id = route.params.id;
  if (id) {
    return inject(PiattoDelGiornoService)
      .find(id)
      .pipe(
        mergeMap((piattoDelGiorno: HttpResponse<IPiattoDelGiorno>) => {
          if (piattoDelGiorno.body) {
            return of(piattoDelGiorno.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default piattoDelGiornoResolve;
