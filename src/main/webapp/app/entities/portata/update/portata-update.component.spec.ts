import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { IMenu } from 'app/entities/menu/menu.model';
import { MenuService } from 'app/entities/menu/service/menu.service';
import { PortataService } from '../service/portata.service';
import { IPortata } from '../portata.model';
import { PortataFormService } from './portata-form.service';

import { PortataUpdateComponent } from './portata-update.component';

describe('Portata Management Update Component', () => {
  let comp: PortataUpdateComponent;
  let fixture: ComponentFixture<PortataUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let portataFormService: PortataFormService;
  let portataService: PortataService;
  let menuService: MenuService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PortataUpdateComponent],
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
      .overrideTemplate(PortataUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PortataUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    portataFormService = TestBed.inject(PortataFormService);
    portataService = TestBed.inject(PortataService);
    menuService = TestBed.inject(MenuService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Menu query and add missing value', () => {
      const portata: IPortata = { id: '74e304a1-0b28-441d-84dc-26fb6eaa1cab' };
      const menu: IMenu = { id: '31716cde-056e-4ccb-8aeb-a4a89e0e4ea6' };
      portata.menu = menu;

      const menuCollection: IMenu[] = [{ id: '31716cde-056e-4ccb-8aeb-a4a89e0e4ea6' }];
      jest.spyOn(menuService, 'query').mockReturnValue(of(new HttpResponse({ body: menuCollection })));
      const additionalMenus = [menu];
      const expectedCollection: IMenu[] = [...additionalMenus, ...menuCollection];
      jest.spyOn(menuService, 'addMenuToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ portata });
      comp.ngOnInit();

      expect(menuService.query).toHaveBeenCalled();
      expect(menuService.addMenuToCollectionIfMissing).toHaveBeenCalledWith(
        menuCollection,
        ...additionalMenus.map(expect.objectContaining),
      );
      expect(comp.menusSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const portata: IPortata = { id: '74e304a1-0b28-441d-84dc-26fb6eaa1cab' };
      const menu: IMenu = { id: '31716cde-056e-4ccb-8aeb-a4a89e0e4ea6' };
      portata.menu = menu;

      activatedRoute.data = of({ portata });
      comp.ngOnInit();

      expect(comp.menusSharedCollection).toContainEqual(menu);
      expect(comp.portata).toEqual(portata);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPortata>>();
      const portata = { id: '5c0fea19-8d9a-428e-877e-25bbb1d768fc' };
      jest.spyOn(portataFormService, 'getPortata').mockReturnValue(portata);
      jest.spyOn(portataService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ portata });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: portata }));
      saveSubject.complete();

      // THEN
      expect(portataFormService.getPortata).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(portataService.update).toHaveBeenCalledWith(expect.objectContaining(portata));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPortata>>();
      const portata = { id: '5c0fea19-8d9a-428e-877e-25bbb1d768fc' };
      jest.spyOn(portataFormService, 'getPortata').mockReturnValue({ id: null });
      jest.spyOn(portataService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ portata: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: portata }));
      saveSubject.complete();

      // THEN
      expect(portataFormService.getPortata).toHaveBeenCalled();
      expect(portataService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPortata>>();
      const portata = { id: '5c0fea19-8d9a-428e-877e-25bbb1d768fc' };
      jest.spyOn(portataService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ portata });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(portataService.update).toHaveBeenCalled();
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
