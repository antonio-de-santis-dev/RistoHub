import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../piatto-del-giorno.test-samples';

import { PiattoDelGiornoFormService } from './piatto-del-giorno-form.service';

describe('PiattoDelGiorno Form Service', () => {
  let service: PiattoDelGiornoFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PiattoDelGiornoFormService);
  });

  describe('Service methods', () => {
    describe('createPiattoDelGiornoFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createPiattoDelGiornoFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            data: expect.any(Object),
            attivo: expect.any(Object),
            nome: expect.any(Object),
            descrizione: expect.any(Object),
            prezzo: expect.any(Object),
            prodotto: expect.any(Object),
          }),
        );
      });

      it('passing IPiattoDelGiorno should create a new form with FormGroup', () => {
        const formGroup = service.createPiattoDelGiornoFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            data: expect.any(Object),
            attivo: expect.any(Object),
            nome: expect.any(Object),
            descrizione: expect.any(Object),
            prezzo: expect.any(Object),
            prodotto: expect.any(Object),
          }),
        );
      });
    });

    describe('getPiattoDelGiorno', () => {
      it('should return NewPiattoDelGiorno for default PiattoDelGiorno initial value', () => {
        const formGroup = service.createPiattoDelGiornoFormGroup(sampleWithNewData);

        const piattoDelGiorno = service.getPiattoDelGiorno(formGroup) as any;

        expect(piattoDelGiorno).toMatchObject(sampleWithNewData);
      });

      it('should return NewPiattoDelGiorno for empty PiattoDelGiorno initial value', () => {
        const formGroup = service.createPiattoDelGiornoFormGroup();

        const piattoDelGiorno = service.getPiattoDelGiorno(formGroup) as any;

        expect(piattoDelGiorno).toMatchObject({});
      });

      it('should return IPiattoDelGiorno', () => {
        const formGroup = service.createPiattoDelGiornoFormGroup(sampleWithRequiredData);

        const piattoDelGiorno = service.getPiattoDelGiorno(formGroup) as any;

        expect(piattoDelGiorno).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IPiattoDelGiorno should not enable id FormControl', () => {
        const formGroup = service.createPiattoDelGiornoFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewPiattoDelGiorno should disable id FormControl', () => {
        const formGroup = service.createPiattoDelGiornoFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
