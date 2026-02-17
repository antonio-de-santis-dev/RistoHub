import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { PiattoDelGiornoDetailComponent } from './piatto-del-giorno-detail.component';

describe('PiattoDelGiorno Management Detail Component', () => {
  let comp: PiattoDelGiornoDetailComponent;
  let fixture: ComponentFixture<PiattoDelGiornoDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PiattoDelGiornoDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              loadComponent: () => import('./piatto-del-giorno-detail.component').then(m => m.PiattoDelGiornoDetailComponent),
              resolve: { piattoDelGiorno: () => of({ id: 'd12c9409-7bc6-4724-bd7c-673f240394df' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(PiattoDelGiornoDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PiattoDelGiornoDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('should load piattoDelGiorno on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', PiattoDelGiornoDetailComponent);

      // THEN
      expect(instance.piattoDelGiorno()).toEqual(expect.objectContaining({ id: 'd12c9409-7bc6-4724-bd7c-673f240394df' }));
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
