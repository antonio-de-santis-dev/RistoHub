import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IProdotto } from '../prodotto.model';

@Component({
  selector: 'jhi-prodotto-detail',
  templateUrl: './prodotto-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class ProdottoDetailComponent {
  prodotto = input<IProdotto | null>(null);

  previousState(): void {
    window.history.back();
  }
}
