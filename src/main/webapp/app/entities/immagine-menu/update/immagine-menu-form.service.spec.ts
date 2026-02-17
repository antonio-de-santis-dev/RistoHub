import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../immagine-menu.test-samples';

import { ImmagineMenuFormService } from './immagine-menu-form.service';

describe('ImmagineMenu Form Service', () => {
  let service: ImmagineMenuFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImmagineMenuFormService);
  });

  describe('Service methods', () => {
    describe('createImmagineMenuFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createImmagineMenuFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nome: expect.any(Object),
            immagine: expect.any(Object),
            contentType: expect.any(Object),
            tipo: expect.any(Object),
            menu: expect.any(Object),
          }),
        );
      });

      it('passing IImmagineMenu should create a new form with FormGroup', () => {
        const formGroup = service.createImmagineMenuFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nome: expect.any(Object),
            immagine: expect.any(Object),
            contentType: expect.any(Object),
            tipo: expect.any(Object),
            menu: expect.any(Object),
          }),
        );
      });
    });

    describe('getImmagineMenu', () => {
      it('should return NewImmagineMenu for default ImmagineMenu initial value', () => {
        const formGroup = service.createImmagineMenuFormGroup(sampleWithNewData);

        const immagineMenu = service.getImmagineMenu(formGroup) as any;

        expect(immagineMenu).toMatchObject(sampleWithNewData);
      });

      it('should return NewImmagineMenu for empty ImmagineMenu initial value', () => {
        const formGroup = service.createImmagineMenuFormGroup();

        const immagineMenu = service.getImmagineMenu(formGroup) as any;

        expect(immagineMenu).toMatchObject({});
      });

      it('should return IImmagineMenu', () => {
        const formGroup = service.createImmagineMenuFormGroup(sampleWithRequiredData);

        const immagineMenu = service.getImmagineMenu(formGroup) as any;

        expect(immagineMenu).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IImmagineMenu should not enable id FormControl', () => {
        const formGroup = service.createImmagineMenuFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewImmagineMenu should disable id FormControl', () => {
        const formGroup = service.createImmagineMenuFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
