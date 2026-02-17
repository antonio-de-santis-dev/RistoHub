import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IProdotto } from '../prodotto.model';
import { ProdottoService } from '../service/prodotto.service';

const prodottoResolve = (route: ActivatedRouteSnapshot): Observable<null | IProdotto> => {
  const id = route.params.id;
  if (id) {
    return inject(ProdottoService)
      .find(id)
      .pipe(
        mergeMap((prodotto: HttpResponse<IProdotto>) => {
          if (prodotto.body) {
            return of(prodotto.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default prodottoResolve;
