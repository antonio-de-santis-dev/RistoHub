import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { PortataDetailComponent } from './portata-detail.component';

describe('Portata Management Detail Component', () => {
  let comp: PortataDetailComponent;
  let fixture: ComponentFixture<PortataDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortataDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              loadComponent: () => import('./portata-detail.component').then(m => m.PortataDetailComponent),
              resolve: { portata: () => of({ id: '5c0fea19-8d9a-428e-877e-25bbb1d768fc' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(PortataDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PortataDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('should load portata on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', PortataDetailComponent);

      // THEN
      expect(instance.portata()).toEqual(expect.objectContaining({ id: '5c0fea19-8d9a-428e-877e-25bbb1d768fc' }));
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
