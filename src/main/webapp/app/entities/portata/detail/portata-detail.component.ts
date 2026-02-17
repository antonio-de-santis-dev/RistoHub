import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IPortata } from '../portata.model';

@Component({
  selector: 'jhi-portata-detail',
  templateUrl: './portata-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class PortataDetailComponent {
  portata = input<IPortata | null>(null);

  previousState(): void {
    window.history.back();
  }
}
