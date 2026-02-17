import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IPortata } from '../portata.model';
import { PortataService } from '../service/portata.service';

const portataResolve = (route: ActivatedRouteSnapshot): Observable<null | IPortata> => {
  const id = route.params.id;
  if (id) {
    return inject(PortataService)
      .find(id)
      .pipe(
        mergeMap((portata: HttpResponse<IPortata>) => {
          if (portata.body) {
            return of(portata.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default portataResolve;
