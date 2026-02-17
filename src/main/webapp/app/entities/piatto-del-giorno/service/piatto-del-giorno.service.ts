import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { DATE_FORMAT } from 'app/config/input.constants';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IPiattoDelGiorno, NewPiattoDelGiorno } from '../piatto-del-giorno.model';

export type PartialUpdatePiattoDelGiorno = Partial<IPiattoDelGiorno> & Pick<IPiattoDelGiorno, 'id'>;

type RestOf<T extends IPiattoDelGiorno | NewPiattoDelGiorno> = Omit<T, 'data'> & {
  data?: string | null;
};

export type RestPiattoDelGiorno = RestOf<IPiattoDelGiorno>;

export type NewRestPiattoDelGiorno = RestOf<NewPiattoDelGiorno>;

export type PartialUpdateRestPiattoDelGiorno = RestOf<PartialUpdatePiattoDelGiorno>;

export type EntityResponseType = HttpResponse<IPiattoDelGiorno>;
export type EntityArrayResponseType = HttpResponse<IPiattoDelGiorno[]>;

@Injectable({ providedIn: 'root' })
export class PiattoDelGiornoService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/piatto-del-giornos');

  create(piattoDelGiorno: NewPiattoDelGiorno): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(piattoDelGiorno);
    return this.http
      .post<RestPiattoDelGiorno>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(piattoDelGiorno: IPiattoDelGiorno): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(piattoDelGiorno);
    return this.http
      .put<RestPiattoDelGiorno>(`${this.resourceUrl}/${this.getPiattoDelGiornoIdentifier(piattoDelGiorno)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(piattoDelGiorno: PartialUpdatePiattoDelGiorno): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(piattoDelGiorno);
    return this.http
      .patch<RestPiattoDelGiorno>(`${this.resourceUrl}/${this.getPiattoDelGiornoIdentifier(piattoDelGiorno)}`, copy, {
        observe: 'response',
      })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http
      .get<RestPiattoDelGiorno>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestPiattoDelGiorno[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getPiattoDelGiornoIdentifier(piattoDelGiorno: Pick<IPiattoDelGiorno, 'id'>): string {
    return piattoDelGiorno.id;
  }

  comparePiattoDelGiorno(o1: Pick<IPiattoDelGiorno, 'id'> | null, o2: Pick<IPiattoDelGiorno, 'id'> | null): boolean {
    return o1 && o2 ? this.getPiattoDelGiornoIdentifier(o1) === this.getPiattoDelGiornoIdentifier(o2) : o1 === o2;
  }

  addPiattoDelGiornoToCollectionIfMissing<Type extends Pick<IPiattoDelGiorno, 'id'>>(
    piattoDelGiornoCollection: Type[],
    ...piattoDelGiornosToCheck: (Type | null | undefined)[]
  ): Type[] {
    const piattoDelGiornos: Type[] = piattoDelGiornosToCheck.filter(isPresent);
    if (piattoDelGiornos.length > 0) {
      const piattoDelGiornoCollectionIdentifiers = piattoDelGiornoCollection.map(piattoDelGiornoItem =>
        this.getPiattoDelGiornoIdentifier(piattoDelGiornoItem),
      );
      const piattoDelGiornosToAdd = piattoDelGiornos.filter(piattoDelGiornoItem => {
        const piattoDelGiornoIdentifier = this.getPiattoDelGiornoIdentifier(piattoDelGiornoItem);
        if (piattoDelGiornoCollectionIdentifiers.includes(piattoDelGiornoIdentifier)) {
          return false;
        }
        piattoDelGiornoCollectionIdentifiers.push(piattoDelGiornoIdentifier);
        return true;
      });
      return [...piattoDelGiornosToAdd, ...piattoDelGiornoCollection];
    }
    return piattoDelGiornoCollection;
  }

  protected convertDateFromClient<T extends IPiattoDelGiorno | NewPiattoDelGiorno | PartialUpdatePiattoDelGiorno>(
    piattoDelGiorno: T,
  ): RestOf<T> {
    return {
      ...piattoDelGiorno,
      data: piattoDelGiorno.data?.format(DATE_FORMAT) ?? null,
    };
  }

  protected convertDateFromServer(restPiattoDelGiorno: RestPiattoDelGiorno): IPiattoDelGiorno {
    return {
      ...restPiattoDelGiorno,
      data: restPiattoDelGiorno.data ? dayjs(restPiattoDelGiorno.data) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestPiattoDelGiorno>): HttpResponse<IPiattoDelGiorno> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestPiattoDelGiorno[]>): HttpResponse<IPiattoDelGiorno[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
