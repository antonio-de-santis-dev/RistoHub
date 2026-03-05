import { Component, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';

import { LoaderService } from './loader.service';

@Component({
  selector: 'rh-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  imports: [AsyncPipe, NgIf],
})
export class LoaderComponent {
  private readonly loaderService = inject(LoaderService);
  loading$ = this.loaderService.loading$;
}
