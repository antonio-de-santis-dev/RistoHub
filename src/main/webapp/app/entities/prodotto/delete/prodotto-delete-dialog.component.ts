import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IProdotto } from '../prodotto.model';
import { ProdottoService } from '../service/prodotto.service';

@Component({
  templateUrl: './prodotto-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class ProdottoDeleteDialogComponent {
  prodotto?: IProdotto;

  protected prodottoService = inject(ProdottoService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.prodottoService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
