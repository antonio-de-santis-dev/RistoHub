import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IAllergene } from '../allergene.model';
import { AllergeneService } from '../service/allergene.service';

const allergeneResolve = (route: ActivatedRouteSnapshot): Observable<null | IAllergene> => {
  const id = route.params.id;
  if (id) {
    return inject(AllergeneService)
      .find(id)
      .pipe(
        mergeMap((allergene: HttpResponse<IAllergene>) => {
          if (allergene.body) {
            return of(allergene.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default allergeneResolve;
