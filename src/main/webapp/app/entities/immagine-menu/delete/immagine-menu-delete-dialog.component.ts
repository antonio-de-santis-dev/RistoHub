import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IImmagineMenu } from '../immagine-menu.model';
import { ImmagineMenuService } from '../service/immagine-menu.service';

@Component({
  templateUrl: './immagine-menu-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class ImmagineMenuDeleteDialogComponent {
  immagineMenu?: IImmagineMenu;

  protected immagineMenuService = inject(ImmagineMenuService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.immagineMenuService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
