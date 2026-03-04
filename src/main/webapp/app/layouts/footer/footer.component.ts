import { Component } from '@angular/core';

@Component({
  selector: 'jhi-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [],
})
export default class FooterComponent {
  currentYear = new Date().getFullYear();
}
