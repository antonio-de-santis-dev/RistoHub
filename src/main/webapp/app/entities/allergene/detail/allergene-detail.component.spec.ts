import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { AllergeneDetailComponent } from './allergene-detail.component';

describe('Allergene Management Detail Component', () => {
  let comp: AllergeneDetailComponent;
  let fixture: ComponentFixture<AllergeneDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllergeneDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              loadComponent: () => import('./allergene-detail.component').then(m => m.AllergeneDetailComponent),
              resolve: { allergene: () => of({ id: '35dfa8eb-a96b-443f-a11e-87b8a1f107d3' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(AllergeneDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AllergeneDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('should load allergene on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', AllergeneDetailComponent);

      // THEN
      expect(instance.allergene()).toEqual(expect.objectContaining({ id: '35dfa8eb-a96b-443f-a11e-87b8a1f107d3' }));
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
