import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../menu.test-samples';

import { MenuFormService } from './menu-form.service';

describe('Menu Form Service', () => {
  let service: MenuFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuFormService);
  });

  describe('Service methods', () => {
    describe('createMenuFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createMenuFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nome: expect.any(Object),
            descrizione: expect.any(Object),
            attivo: expect.any(Object),
            templateStyle: expect.any(Object),
            colorePrimario: expect.any(Object),
            coloreSecondario: expect.any(Object),
            fontMenu: expect.any(Object),
            ristoratore: expect.any(Object),
          }),
        );
      });

      it('passing IMenu should create a new form with FormGroup', () => {
        const formGroup = service.createMenuFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            nome: expect.any(Object),
            descrizione: expect.any(Object),
            attivo: expect.any(Object),
            templateStyle: expect.any(Object),
            colorePrimario: expect.any(Object),
            coloreSecondario: expect.any(Object),
            fontMenu: expect.any(Object),
            ristoratore: expect.any(Object),
          }),
        );
      });
    });

    describe('getMenu', () => {
      it('should return NewMenu for default Menu initial value', () => {
        const formGroup = service.createMenuFormGroup(sampleWithNewData);

        const menu = service.getMenu(formGroup) as any;

        expect(menu).toMatchObject(sampleWithNewData);
      });

      it('should return NewMenu for empty Menu initial value', () => {
        const formGroup = service.createMenuFormGroup();

        const menu = service.getMenu(formGroup) as any;

        expect(menu).toMatchObject({});
      });

      it('should return IMenu', () => {
        const formGroup = service.createMenuFormGroup(sampleWithRequiredData);

        const menu = service.getMenu(formGroup) as any;

        expect(menu).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IMenu should not enable id FormControl', () => {
        const formGroup = service.createMenuFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewMenu should disable id FormControl', () => {
        const formGroup = service.createMenuFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
