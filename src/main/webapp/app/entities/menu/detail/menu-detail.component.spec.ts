import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { MenuDetailComponent } from './menu-detail.component';

describe('Menu Management Detail Component', () => {
  let comp: MenuDetailComponent;
  let fixture: ComponentFixture<MenuDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuDetailComponent],
      providers: [
        provideRouter(
          [
            {
              path: '**',
              loadComponent: () => import('./menu-detail.component').then(m => m.MenuDetailComponent),
              resolve: { menu: () => of({ id: '31716cde-056e-4ccb-8aeb-a4a89e0e4ea6' }) },
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    })
      .overrideTemplate(MenuDetailComponent, '')
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuDetailComponent);
    comp = fixture.componentInstance;
  });

  describe('OnInit', () => {
    it('should load menu on init', async () => {
      const harness = await RouterTestingHarness.create();
      const instance = await harness.navigateByUrl('/', MenuDetailComponent);

      // THEN
      expect(instance.menu()).toEqual(expect.objectContaining({ id: '31716cde-056e-4ccb-8aeb-a4a89e0e4ea6' }));
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
