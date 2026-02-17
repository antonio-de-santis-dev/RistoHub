import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../prodotto.test-samples';

import { ProdottoFormService } from './prodotto-form.service';

describe('Prodotto Form Service', () => {
  let service: ProdottoFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProdottoFormService);
  });

  describe('Service methods', () => {
    describe('createProdottoFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createProdottoFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nome: expect.any(Object),
            descrizione: expect.any(Object),
            prezzo: expect.any(Object),
            allergenis: expect.any(Object),
            portata: expect.any(Object),
          }),
        );
      });

      it('passing IProdotto should create a new form with FormGroup', () => {
        const formGroup = service.createProdottoFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nome: expect.any(Object),
            descrizione: expect.any(Object),
            prezzo: expect.any(Object),
            allergenis: expect.any(Object),
            portata: expect.any(Object),
          }),
        );
      });
    });

    describe('getProdotto', () => {
      it('should return NewProdotto for default Prodotto initial value', () => {
        const formGroup = service.createProdottoFormGroup(sampleWithNewData);

        const prodotto = service.getProdotto(formGroup) as any;

        expect(prodotto).toMatchObject(sampleWithNewData);
      });

      it('should return NewProdotto for empty Prodotto initial value', () => {
        const formGroup = service.createProdottoFormGroup();

        const prodotto = service.getProdotto(formGroup) as any;

        expect(prodotto).toMatchObject({});
      });

      it('should return IProdotto', () => {
        const formGroup = service.createProdottoFormGroup(sampleWithRequiredData);

        const prodotto = service.getProdotto(formGroup) as any;

        expect(prodotto).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IProdotto should not enable id FormControl', () => {
        const formGroup = service.createProdottoFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewProdotto should disable id FormControl', () => {
        const formGroup = service.createProdottoFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
