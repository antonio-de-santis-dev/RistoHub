import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IProdotto, NewProdotto } from '../prodotto.model';

export type PartialUpdateProdotto = Partial<IProdotto> & Pick<IProdotto, 'id'>;

export type EntityResponseType = HttpResponse<IProdotto>;
export type EntityArrayResponseType = HttpResponse<IProdotto[]>;

@Injectable({ providedIn: 'root' })
export class ProdottoService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/prodottos');

  create(prodotto: NewProdotto): Observable<EntityResponseType> {
    return this.http.post<IProdotto>(this.resourceUrl, prodotto, { observe: 'response' });
  }

  update(prodotto: IProdotto): Observable<EntityResponseType> {
    return this.http.put<IProdotto>(`${this.resourceUrl}/${this.getProdottoIdentifier(prodotto)}`, prodotto, { observe: 'response' });
  }

  partialUpdate(prodotto: PartialUpdateProdotto): Observable<EntityResponseType> {
    return this.http.patch<IProdotto>(`${this.resourceUrl}/${this.getProdottoIdentifier(prodotto)}`, prodotto, { observe: 'response' });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IProdotto>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IProdotto[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getProdottoIdentifier(prodotto: Pick<IProdotto, 'id'>): string {
    return prodotto.id;
  }

  compareProdotto(o1: Pick<IProdotto, 'id'> | null, o2: Pick<IProdotto, 'id'> | null): boolean {
    return o1 && o2 ? this.getProdottoIdentifier(o1) === this.getProdottoIdentifier(o2) : o1 === o2;
  }

  addProdottoToCollectionIfMissing<Type extends Pick<IProdotto, 'id'>>(
    prodottoCollection: Type[],
    ...prodottosToCheck: (Type | null | undefined)[]
  ): Type[] {
    const prodottos: Type[] = prodottosToCheck.filter(isPresent);
    if (prodottos.length > 0) {
      const prodottoCollectionIdentifiers = prodottoCollection.map(prodottoItem => this.getProdottoIdentifier(prodottoItem));
      const prodottosToAdd = prodottos.filter(prodottoItem => {
        const prodottoIdentifier = this.getProdottoIdentifier(prodottoItem);
        if (prodottoCollectionIdentifiers.includes(prodottoIdentifier)) {
          return false;
        }
        prodottoCollectionIdentifiers.push(prodottoIdentifier);
        return true;
      });
      return [...prodottosToAdd, ...prodottoCollection];
    }
    return prodottoCollection;
  }
}
