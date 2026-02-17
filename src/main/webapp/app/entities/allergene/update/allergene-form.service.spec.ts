import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../allergene.test-samples';

import { AllergeneFormService } from './allergene-form.service';

describe('Allergene Form Service', () => {
  let service: AllergeneFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AllergeneFormService);
  });

  describe('Service methods', () => {
    describe('createAllergeneFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createAllergeneFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nome: expect.any(Object),
            simbolo: expect.any(Object),
            prodottos: expect.any(Object),
          }),
        );
      });

      it('passing IAllergene should create a new form with FormGroup', () => {
        const formGroup = service.createAllergeneFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nome: expect.any(Object),
            simbolo: expect.any(Object),
            prodottos: expect.any(Object),
          }),
        );
      });
    });

    describe('getAllergene', () => {
      it('should return NewAllergene for default Allergene initial value', () => {
        const formGroup = service.createAllergeneFormGroup(sampleWithNewData);

        const allergene = service.getAllergene(formGroup) as any;

        expect(allergene).toMatchObject(sampleWithNewData);
      });

      it('should return NewAllergene for empty Allergene initial value', () => {
        const formGroup = service.createAllergeneFormGroup();

        const allergene = service.getAllergene(formGroup) as any;

        expect(allergene).toMatchObject({});
      });

      it('should return IAllergene', () => {
        const formGroup = service.createAllergeneFormGroup(sampleWithRequiredData);

        const allergene = service.getAllergene(formGroup) as any;

        expect(allergene).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IAllergene should not enable id FormControl', () => {
        const formGroup = service.createAllergeneFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewAllergene should disable id FormControl', () => {
        const formGroup = service.createAllergeneFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
