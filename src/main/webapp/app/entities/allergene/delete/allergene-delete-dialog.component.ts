import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IAllergene } from '../allergene.model';
import { AllergeneService } from '../service/allergene.service';

@Component({
  templateUrl: './allergene-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class AllergeneDeleteDialogComponent {
  allergene?: IAllergene;

  protected allergeneService = inject(AllergeneService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.allergeneService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
