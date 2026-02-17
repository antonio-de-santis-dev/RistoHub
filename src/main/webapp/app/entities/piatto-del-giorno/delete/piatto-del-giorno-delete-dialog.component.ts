import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IPiattoDelGiorno } from '../piatto-del-giorno.model';
import { PiattoDelGiornoService } from '../service/piatto-del-giorno.service';

@Component({
  templateUrl: './piatto-del-giorno-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class PiattoDelGiornoDeleteDialogComponent {
  piattoDelGiorno?: IPiattoDelGiorno;

  protected piattoDelGiornoService = inject(PiattoDelGiornoService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.piattoDelGiornoService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
