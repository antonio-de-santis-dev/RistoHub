import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IPortata, NewPortata } from '../portata.model';

export type PartialUpdatePortata = Partial<IPortata> & Pick<IPortata, 'id'>;

export type EntityResponseType = HttpResponse<IPortata>;
export type EntityArrayResponseType = HttpResponse<IPortata[]>;

@Injectable({ providedIn: 'root' })
export class PortataService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/portatas');

  create(portata: NewPortata): Observable<EntityResponseType> {
    return this.http.post<IPortata>(this.resourceUrl, portata, { observe: 'response' });
  }

  update(portata: IPortata): Observable<EntityResponseType> {
    return this.http.put<IPortata>(`${this.resourceUrl}/${this.getPortataIdentifier(portata)}`, portata, { observe: 'response' });
  }

  partialUpdate(portata: PartialUpdatePortata): Observable<EntityResponseType> {
    return this.http.patch<IPortata>(`${this.resourceUrl}/${this.getPortataIdentifier(portata)}`, portata, { observe: 'response' });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IPortata>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IPortata[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getPortataIdentifier(portata: Pick<IPortata, 'id'>): string {
    return portata.id;
  }

  comparePortata(o1: Pick<IPortata, 'id'> | null, o2: Pick<IPortata, 'id'> | null): boolean {
    return o1 && o2 ? this.getPortataIdentifier(o1) === this.getPortataIdentifier(o2) : o1 === o2;
  }

  addPortataToCollectionIfMissing<Type extends Pick<IPortata, 'id'>>(
    portataCollection: Type[],
    ...portatasToCheck: (Type | null | undefined)[]
  ): Type[] {
    const portatas: Type[] = portatasToCheck.filter(isPresent);
    if (portatas.length > 0) {
      const portataCollectionIdentifiers = portataCollection.map(portataItem => this.getPortataIdentifier(portataItem));
      const portatasToAdd = portatas.filter(portataItem => {
        const portataIdentifier = this.getPortataIdentifier(portataItem);
        if (portataCollectionIdentifiers.includes(portataIdentifier)) {
          return false;
        }
        portataCollectionIdentifiers.push(portataIdentifier);
        return true;
      });
      return [...portatasToAdd, ...portataCollection];
    }
    return portataCollection;
  }
}
