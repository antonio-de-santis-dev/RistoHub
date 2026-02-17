import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { ProdottoDetailComponent } from './prodotto-detail.component';

describe('Prodotto Management Detail Component', () => {
  let comp: ProdottoDetailComponent;
  let fixture: ComponentFixture<ProdottoDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProdottoDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              loadComponent: () => import('./prodotto-detail.component').then(m => m.ProdottoDetailComponent),
              resolve: { prodotto: () => of({ id: '0e2c6771-3027-41d7-a534-418de56ec373' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(ProdottoDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProdottoDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('should load prodotto on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', ProdottoDetailComponent);

      // THEN
      expect(instance.prodotto()).toEqual(expect.objectContaining({ id: '0e2c6771-3027-41d7-a534-418de56ec373' }));
    });
  });

  describe('PreviousState', () => {
    it('should navigate to previous state', () => {
      jest.spyOn(window.history, 'back');
      comp.previousState();
      expect(window.history.back).toHaveBeenCalled();
    });
  });
});
