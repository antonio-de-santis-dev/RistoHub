import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IMenu, NewMenu } from '../menu.model';

export type PartialUpdateMenu = Partial<IMenu> & Pick<IMenu, 'id'>;

export type EntityResponseType = HttpResponse<IMenu>;
export type EntityArrayResponseType = HttpResponse<IMenu[]>;

@Injectable({ providedIn: 'root' })
export class MenuService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/menus');

  create(menu: NewMenu): Observable<EntityResponseType> {
    return this.http.post<IMenu>(this.resourceUrl, menu, { observe: 'response' });
  }

  update(menu: IMenu): Observable<EntityResponseType> {
    return this.http.put<IMenu>(`${this.resourceUrl}/${this.getMenuIdentifier(menu)}`, menu, { observe: 'response' });
  }

  partialUpdate(menu: PartialUpdateMenu): Observable<EntityResponseType> {
    return this.http.patch<IMenu>(`${this.resourceUrl}/${this.getMenuIdentifier(menu)}`, menu, { observe: 'response' });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IMenu>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IMenu[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getMenuIdentifier(menu: Pick<IMenu, 'id'>): string {
    return menu.id;
  }

  compareMenu(o1: Pick<IMenu, 'id'> | null, o2: Pick<IMenu, 'id'> | null): boolean {
    return o1 && o2 ? this.getMenuIdentifier(o1) === this.getMenuIdentifier(o2) : o1 === o2;
  }

  addMenuToCollectionIfMissing<Type extends Pick<IMenu, 'id'>>(
    menuCollection: Type[],
    ...menusToCheck: (Type | null | undefined)[]
  ): Type[] {
    const menus: Type[] = menusToCheck.filter(isPresent);
    if (menus.length > 0) {
      const menuCollectionIdentifiers = menuCollection.map(menuItem => this.getMenuIdentifier(menuItem));
      const menusToAdd = menus.filter(menuItem => {
        const menuIdentifier = this.getMenuIdentifier(menuItem);
        if (menuCollectionIdentifiers.includes(menuIdentifier)) {
          return false;
        }
        menuCollectionIdentifiers.push(menuIdentifier);
        return true;
      });
      return [...menusToAdd, ...menuCollection];
    }
    return menuCollection;
  }
}
