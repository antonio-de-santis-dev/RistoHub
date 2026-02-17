import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IMenu } from '../menu.model';
import { MenuService } from '../service/menu.service';

@Component({
  templateUrl: './menu-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class MenuDeleteDialogComponent {
  menu?: IMenu;

  protected menuService = inject(MenuService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.menuService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
