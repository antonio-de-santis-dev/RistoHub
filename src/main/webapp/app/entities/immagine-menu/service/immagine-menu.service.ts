import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IImmagineMenu, NewImmagineMenu } from '../immagine-menu.model';

export type PartialUpdateImmagineMenu = Partial<IImmagineMenu> & Pick<IImmagineMenu, 'id'>;

export type EntityResponseType = HttpResponse<IImmagineMenu>;
export type EntityArrayResponseType = HttpResponse<IImmagineMenu[]>;

@Injectable({ providedIn: 'root' })
export class ImmagineMenuService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/immagine-menus');

  create(immagineMenu: NewImmagineMenu): Observable<EntityResponseType> {
    return this.http.post<IImmagineMenu>(this.resourceUrl, immagineMenu, { observe: 'response' });
  }

  update(immagineMenu: IImmagineMenu): Observable<EntityResponseType> {
    return this.http.put<IImmagineMenu>(`${this.resourceUrl}/${this.getImmagineMenuIdentifier(immagineMenu)}`, immagineMenu, {
      observe: 'response',
    });
  }

  partialUpdate(immagineMenu: PartialUpdateImmagineMenu): Observable<EntityResponseType> {
    return this.http.patch<IImmagineMenu>(`${this.resourceUrl}/${this.getImmagineMenuIdentifier(immagineMenu)}`, immagineMenu, {
      observe: 'response',
    });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IImmagineMenu>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IImmagineMenu[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getImmagineMenuIdentifier(immagineMenu: Pick<IImmagineMenu, 'id'>): string {
    return immagineMenu.id;
  }

  compareImmagineMenu(o1: Pick<IImmagineMenu, 'id'> | null, o2: Pick<IImmagineMenu, 'id'> | null): boolean {
    return o1 && o2 ? this.getImmagineMenuIdentifier(o1) === this.getImmagineMenuIdentifier(o2) : o1 === o2;
  }

  addImmagineMenuToCollectionIfMissing<Type extends Pick<IImmagineMenu, 'id'>>(
    immagineMenuCollection: Type[],
    ...immagineMenusToCheck: (Type | null | undefined)[]
  ): Type[] {
    const immagineMenus: Type[] = immagineMenusToCheck.filter(isPresent);
    if (immagineMenus.length > 0) {
      const immagineMenuCollectionIdentifiers = immagineMenuCollection.map(immagineMenuItem =>
        this.getImmagineMenuIdentifier(immagineMenuItem),
      );
      const immagineMenusToAdd = immagineMenus.filter(immagineMenuItem => {
        const immagineMenuIdentifier = this.getImmagineMenuIdentifier(immagineMenuItem);
        if (immagineMenuCollectionIdentifiers.includes(immagineMenuIdentifier)) {
          return false;
        }
        immagineMenuCollectionIdentifiers.push(immagineMenuIdentifier);
        return true;
      });
      return [...immagineMenusToAdd, ...immagineMenuCollection];
    }
    return immagineMenuCollection;
  }
}
