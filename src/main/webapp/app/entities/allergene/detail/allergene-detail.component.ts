import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IAllergene } from '../allergene.model';

@Component({
  selector: 'jhi-allergene-detail',
  templateUrl: './allergene-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class AllergeneDetailComponent {
  allergene = input<IAllergene | null>(null);

  previousState(): void {
    window.history.back();
  }
}
