import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../portata.test-samples';

import { PortataFormService } from './portata-form.service';

describe('Portata Form Service', () => {
  let service: PortataFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortataFormService);
  });

  describe('Service methods', () => {
    describe('createPortataFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createPortataFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            tipo: expect.any(Object),
            nomeDefault: expect.any(Object),
            nomePersonalizzato: expect.any(Object),
            menu: expect.any(Object),
          }),
        );
      });

      it('passing IPortata should create a new form with FormGroup', () => {
        const formGroup = service.createPortataFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            tipo: expect.any(Object),
            nomeDefault: expect.any(Object),
            nomePersonalizzato: expect.any(Object),
            menu: expect.any(Object),
          }),
        );
      });
    });

    describe('getPortata', () => {
      it('should return NewPortata for default Portata initial value', () => {
        const formGroup = service.createPortataFormGroup(sampleWithNewData);

        const portata = service.getPortata(formGroup) as any;

        expect(portata).toMatchObject(sampleWithNewData);
      });

      it('should return NewPortata for empty Portata initial value', () => {
        const formGroup = service.createPortataFormGroup();

        const portata = service.getPortata(formGroup) as any;

        expect(portata).toMatchObject({});
      });

      it('should return IPortata', () => {
        const formGroup = service.createPortataFormGroup(sampleWithRequiredData);

        const portata = service.getPortata(formGroup) as any;

        expect(portata).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IPortata should not enable id FormControl', () => {
        const formGroup = service.createPortataFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewPortata should disable id FormControl', () => {
        const formGroup = service.createPortataFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
