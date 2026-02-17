import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IMenu } from '../menu.model';

@Component({
  selector: 'jhi-menu-detail',
  templateUrl: './menu-detail.component.html',
  imports: [SharedModule, RouterModule],
})
export class MenuDetailComponent {
  menu = input<IMenu | null>(null);

  previousState(): void {
    window.history.back();
  }
}
