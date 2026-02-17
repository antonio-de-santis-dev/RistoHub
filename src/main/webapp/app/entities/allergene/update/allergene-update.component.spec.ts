import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { IProdotto } from 'app/entities/prodotto/prodotto.model';
import { ProdottoService } from 'app/entities/prodotto/service/prodotto.service';
import { AllergeneService } from '../service/allergene.service';
import { IAllergene } from '../allergene.model';
import { AllergeneFormService } from './allergene-form.service';

import { AllergeneUpdateComponent } from './allergene-update.component';

describe('Allergene Management Update Component', () => {
  let comp: AllergeneUpdateComponent;
  let fixture: ComponentFixture<AllergeneUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let allergeneFormService: AllergeneFormService;
  let allergeneService: AllergeneService;
  let prodottoService: ProdottoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AllergeneUpdateComponent],
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
      .overrideTemplate(AllergeneUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(AllergeneUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    allergeneFormService = TestBed.inject(AllergeneFormService);
    allergeneService = TestBed.inject(AllergeneService);
    prodottoService = TestBed.inject(ProdottoService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Prodotto query and add missing value', () => {
      const allergene: IAllergene = { id: '7916bb91-6f33-42b1-a04f-81d88b92555e' };
      const prodottos: IProdotto[] = [{ id: '0e2c6771-3027-41d7-a534-418de56ec373' }];
      allergene.prodottos = prodottos;

      const prodottoCollection: IProdotto[] = [{ id: '0e2c6771-3027-41d7-a534-418de56ec373' }];
      jest.spyOn(prodottoService, 'query').mockReturnValue(of(new HttpResponse({ body: prodottoCollection })));
      const additionalProdottos = [...prodottos];
      const expectedCollection: IProdotto[] = [...additionalProdottos, ...prodottoCollection];
      jest.spyOn(prodottoService, 'addProdottoToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ allergene });
      comp.ngOnInit();

      expect(prodottoService.query).toHaveBeenCalled();
      expect(prodottoService.addProdottoToCollectionIfMissing).toHaveBeenCalledWith(
        prodottoCollection,
        ...additionalProdottos.map(expect.objectContaining),
      );
      expect(comp.prodottosSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const allergene: IAllergene = { id: '7916bb91-6f33-42b1-a04f-81d88b92555e' };
      const prodotto: IProdotto = { id: '0e2c6771-3027-41d7-a534-418de56ec373' };
      allergene.prodottos = [prodotto];

      activatedRoute.data = of({ allergene });
      comp.ngOnInit();

      expect(comp.prodottosSharedCollection).toContainEqual(prodotto);
      expect(comp.allergene).toEqual(allergene);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IAllergene>>();
      const allergene = { id: '35dfa8eb-a96b-443f-a11e-87b8a1f107d3' };
      jest.spyOn(allergeneFormService, 'getAllergene').mockReturnValue(allergene);
      jest.spyOn(allergeneService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ allergene });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: allergene }));
      saveSubject.complete();

      // THEN
      expect(allergeneFormService.getAllergene).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(allergeneService.update).toHaveBeenCalledWith(expect.objectContaining(allergene));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IAllergene>>();
      const allergene = { id: '35dfa8eb-a96b-443f-a11e-87b8a1f107d3' };
      jest.spyOn(allergeneFormService, 'getAllergene').mockReturnValue({ id: null });
      jest.spyOn(allergeneService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ allergene: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: allergene }));
      saveSubject.complete();

      // THEN
      expect(allergeneFormService.getAllergene).toHaveBeenCalled();
      expect(allergeneService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IAllergene>>();
      const allergene = { id: '35dfa8eb-a96b-443f-a11e-87b8a1f107d3' };
      jest.spyOn(allergeneService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ allergene });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(allergeneService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareProdotto', () => {
      it('should forward to prodottoService', () => {
        const entity = { id: '0e2c6771-3027-41d7-a534-418de56ec373' };
        const entity2 = { id: 'b535ea01-d7dd-4cfe-9ddf-1777df7d8ada' };
        jest.spyOn(prodottoService, 'compareProdotto');
        comp.compareProdotto(entity, entity2);
        expect(prodottoService.compareProdotto).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
