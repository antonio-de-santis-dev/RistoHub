import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { IProdotto } from 'app/entities/prodotto/prodotto.model';
import { ProdottoService } from 'app/entities/prodotto/service/prodotto.service';
import { PiattoDelGiornoService } from '../service/piatto-del-giorno.service';
import { IPiattoDelGiorno } from '../piatto-del-giorno.model';
import { PiattoDelGiornoFormService } from './piatto-del-giorno-form.service';

import { PiattoDelGiornoUpdateComponent } from './piatto-del-giorno-update.component';

describe('PiattoDelGiorno Management Update Component', () => {
  let comp: PiattoDelGiornoUpdateComponent;
  let fixture: ComponentFixture<PiattoDelGiornoUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let piattoDelGiornoFormService: PiattoDelGiornoFormService;
  let piattoDelGiornoService: PiattoDelGiornoService;
  let prodottoService: ProdottoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PiattoDelGiornoUpdateComponent],
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
      .overrideTemplate(PiattoDelGiornoUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(PiattoDelGiornoUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    piattoDelGiornoFormService = TestBed.inject(PiattoDelGiornoFormService);
    piattoDelGiornoService = TestBed.inject(PiattoDelGiornoService);
    prodottoService = TestBed.inject(ProdottoService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Prodotto query and add missing value', () => {
      const piattoDelGiorno: IPiattoDelGiorno = { id: 'ac00cf51-852a-479d-bda4-966132055aea' };
      const prodotto: IProdotto = { id: '0e2c6771-3027-41d7-a534-418de56ec373' };
      piattoDelGiorno.prodotto = prodotto;

      const prodottoCollection: IProdotto[] = [{ id: '0e2c6771-3027-41d7-a534-418de56ec373' }];
      jest.spyOn(prodottoService, 'query').mockReturnValue(of(new HttpResponse({ body: prodottoCollection })));
      const additionalProdottos = [prodotto];
      const expectedCollection: IProdotto[] = [...additionalProdottos, ...prodottoCollection];
      jest.spyOn(prodottoService, 'addProdottoToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ piattoDelGiorno });
      comp.ngOnInit();

      expect(prodottoService.query).toHaveBeenCalled();
      expect(prodottoService.addProdottoToCollectionIfMissing).toHaveBeenCalledWith(
        prodottoCollection,
        ...additionalProdottos.map(expect.objectContaining),
      );
      expect(comp.prodottosSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const piattoDelGiorno: IPiattoDelGiorno = { id: 'ac00cf51-852a-479d-bda4-966132055aea' };
      const prodotto: IProdotto = { id: '0e2c6771-3027-41d7-a534-418de56ec373' };
      piattoDelGiorno.prodotto = prodotto;

      activatedRoute.data = of({ piattoDelGiorno });
      comp.ngOnInit();

      expect(comp.prodottosSharedCollection).toContainEqual(prodotto);
      expect(comp.piattoDelGiorno).toEqual(piattoDelGiorno);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPiattoDelGiorno>>();
      const piattoDelGiorno = { id: 'd12c9409-7bc6-4724-bd7c-673f240394df' };
      jest.spyOn(piattoDelGiornoFormService, 'getPiattoDelGiorno').mockReturnValue(piattoDelGiorno);
      jest.spyOn(piattoDelGiornoService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ piattoDelGiorno });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: piattoDelGiorno }));
      saveSubject.complete();

      // THEN
      expect(piattoDelGiornoFormService.getPiattoDelGiorno).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(piattoDelGiornoService.update).toHaveBeenCalledWith(expect.objectContaining(piattoDelGiorno));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPiattoDelGiorno>>();
      const piattoDelGiorno = { id: 'd12c9409-7bc6-4724-bd7c-673f240394df' };
      jest.spyOn(piattoDelGiornoFormService, 'getPiattoDelGiorno').mockReturnValue({ id: null });
      jest.spyOn(piattoDelGiornoService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ piattoDelGiorno: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: piattoDelGiorno }));
      saveSubject.complete();

      // THEN
      expect(piattoDelGiornoFormService.getPiattoDelGiorno).toHaveBeenCalled();
      expect(piattoDelGiornoService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IPiattoDelGiorno>>();
      const piattoDelGiorno = { id: 'd12c9409-7bc6-4724-bd7c-673f240394df' };
      jest.spyOn(piattoDelGiornoService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ piattoDelGiorno });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(piattoDelGiornoService.update).toHaveBeenCalled();
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
