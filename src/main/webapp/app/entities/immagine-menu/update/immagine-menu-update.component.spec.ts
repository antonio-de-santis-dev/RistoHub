import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { IMenu } from 'app/entities/menu/menu.model';
import { MenuService } from 'app/entities/menu/service/menu.service';
import { ImmagineMenuService } from '../service/immagine-menu.service';
import { IImmagineMenu } from '../immagine-menu.model';
import { ImmagineMenuFormService } from './immagine-menu-form.service';

import { ImmagineMenuUpdateComponent } from './immagine-menu-update.component';

describe('ImmagineMenu Management Update Component', () => {
  let comp: ImmagineMenuUpdateComponent;
  let fixture: ComponentFixture<ImmagineMenuUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let immagineMenuFormService: ImmagineMenuFormService;
  let immagineMenuService: ImmagineMenuService;
  let menuService: MenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ImmagineMenuUpdateComponent],
      providers: [
        provideHttpClient(),
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(ImmagineMenuUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ImmagineMenuUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    immagineMenuFormService = TestBed.inject(ImmagineMenuFormService);
    immagineMenuService = TestBed.inject(ImmagineMenuService);
    menuService = TestBed.inject(MenuService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Menu query and add missing value', () => {
      const immagineMenu: IImmagineMenu = { id: 'b4e22f1f-4b76-4551-a1eb-e60cde093f8e' };
      const menu: IMenu = { id: '31716cde-056e-4ccb-8aeb-a4a89e0e4ea6' };
      immagineMenu.menu = menu;

      const menuCollection: IMenu[] = [{ id: '31716cde-056e-4ccb-8aeb-a4a89e0e4ea6' }];
      jest.spyOn(menuService, 'query').mockReturnValue(of(new HttpResponse({ body: menuCollection })));
      const additionalMenus = [menu];
      const expectedCollection: IMenu[] = [...additionalMenus, ...menuCollection];
      jest.spyOn(menuService, 'addMenuToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ immagineMenu });
      comp.ngOnInit();

      expect(menuService.query).toHaveBeenCalled();
      expect(menuService.addMenuToCollectionIfMissing).toHaveBeenCalledWith(
        menuCollection,
        ...additionalMenus.map(expect.objectContaining),
      );
      expect(comp.menusSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const immagineMenu: IImmagineMenu = { id: 'b4e22f1f-4b76-4551-a1eb-e60cde093f8e' };
      const menu: IMenu = { id: '31716cde-056e-4ccb-8aeb-a4a89e0e4ea6' };
      immagineMenu.menu = menu;

      activatedRoute.data = of({ immagineMenu });
      comp.ngOnInit();

      expect(comp.menusSharedCollection).toContainEqual(menu);
      expect(comp.immagineMenu).toEqual(immagineMenu);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IImmagineMenu>>();
      const immagineMenu = { id: '51fae420-2a67-4332-89cd-f89fab2d93ce' };
      jest.spyOn(immagineMenuFormService, 'getImmagineMenu').mockReturnValue(immagineMenu);
      jest.spyOn(immagineMenuService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ immagineMenu });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: immagineMenu }));
      saveSubject.complete();

      // THEN
      expect(immagineMenuFormService.getImmagineMenu).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(immagineMenuService.update).toHaveBeenCalledWith(expect.objectContaining(immagineMenu));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IImmagineMenu>>();
      const immagineMenu = { id: '51fae420-2a67-4332-89cd-f89fab2d93ce' };
      jest.spyOn(immagineMenuFormService, 'getImmagineMenu').mockReturnValue({ id: null });
      jest.spyOn(immagineMenuService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ immagineMenu: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: immagineMenu }));
      saveSubject.complete();

      // THEN
      expect(immagineMenuFormService.getImmagineMenu).toHaveBeenCalled();
      expect(immagineMenuService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IImmagineMenu>>();
      const immagineMenu = { id: '51fae420-2a67-4332-89cd-f89fab2d93ce' };
      jest.spyOn(immagineMenuService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ immagineMenu });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(immagineMenuService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareMenu', () => {
      it('should forward to menuService', () => {
        const entity = { id: '31716cde-056e-4ccb-8aeb-a4a89e0e4ea6' };
        const entity2 = { id: '1aee1ef4-c378-435e-a69c-3c47ce714e34' };
        jest.spyOn(menuService, 'compareMenu');
        comp.compareMenu(entity, entity2);
        expect(menuService.compareMenu).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
