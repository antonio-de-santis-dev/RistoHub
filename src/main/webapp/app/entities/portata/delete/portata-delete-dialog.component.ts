import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IPortata } from '../portata.model';
import { PortataService } from '../service/portata.service';

@Component({
  templateUrl: './portata-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class PortataDeleteDialogComponent {
  portata?: IPortata;

  protected portataService = inject(PortataService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.portataService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
