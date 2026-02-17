import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { FormatMediumDatePipe } from 'app/shared/date';
import { IPiattoDelGiorno } from '../piatto-del-giorno.model';

@Component({
  selector: 'jhi-piatto-del-giorno-detail',
  templateUrl: './piatto-del-giorno-detail.component.html',
  imports: [SharedModule, RouterModule, FormatMediumDatePipe],
})
export class PiattoDelGiornoDetailComponent {
  piattoDelGiorno = input<IPiattoDelGiorno | null>(null);

  previousState(): void {
    window.history.back();
  }
}
