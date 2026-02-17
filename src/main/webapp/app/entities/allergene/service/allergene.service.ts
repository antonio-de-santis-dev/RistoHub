import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IAllergene, NewAllergene } from '../allergene.model';

export type PartialUpdateAllergene = Partial<IAllergene> & Pick<IAllergene, 'id'>;

export type EntityResponseType = HttpResponse<IAllergene>;
export type EntityArrayResponseType = HttpResponse<IAllergene[]>;

@Injectable({ providedIn: 'root' })
export class AllergeneService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/allergenes');

  create(allergene: NewAllergene): Observable<EntityResponseType> {
    return this.http.post<IAllergene>(this.resourceUrl, allergene, { observe: 'response' });
  }

  update(allergene: IAllergene): Observable<EntityResponseType> {
    return this.http.put<IAllergene>(`${this.resourceUrl}/${this.getAllergeneIdentifier(allergene)}`, allergene, { observe: 'response' });
  }

  partialUpdate(allergene: PartialUpdateAllergene): Observable<EntityResponseType> {
    return this.http.patch<IAllergene>(`${this.resourceUrl}/${this.getAllergeneIdentifier(allergene)}`, allergene, { observe: 'response' });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IAllergene>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IAllergene[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getAllergeneIdentifier(allergene: Pick<IAllergene, 'id'>): string {
    return allergene.id;
  }

  compareAllergene(o1: Pick<IAllergene, 'id'> | null, o2: Pick<IAllergene, 'id'> | null): boolean {
    return o1 && o2 ? this.getAllergeneIdentifier(o1) === this.getAllergeneIdentifier(o2) : o1 === o2;
  }

  addAllergeneToCollectionIfMissing<Type extends Pick<IAllergene, 'id'>>(
    allergeneCollection: Type[],
    ...allergenesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const allergenes: Type[] = allergenesToCheck.filter(isPresent);
    if (allergenes.length > 0) {
      const allergeneCollectionIdentifiers = allergeneCollection.map(allergeneItem => this.getAllergeneIdentifier(allergeneItem));
      const allergenesToAdd = allergenes.filter(allergeneItem => {
        const allergeneIdentifier = this.getAllergeneIdentifier(allergeneItem);
        if (allergeneCollectionIdentifiers.includes(allergeneIdentifier)) {
          return false;
        }
        allergeneCollectionIdentifiers.push(allergeneIdentifier);
        return true;
      });
      return [...allergenesToAdd, ...allergeneCollection];
    }
    return allergeneCollection;
  }
}
