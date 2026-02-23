import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountService } from 'app/core/auth/account.service';

@Component({
  selector: 'jhi-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, OnDestroy {
  private styleTag: HTMLStyleElement | null = null;

  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    // Nasconde la navbar sulla landing
    this.styleTag = document.createElement('style');
    this.styleTag.id = 'landing-hide-navbar';
    this.styleTag.textContent = `
      jhi-navbar,
      nav.navbar,
      router-outlet[name="navbar"] ~ * {
        display: none !important;
      }
    `;
    document.head.appendChild(this.styleTag);

    // NON fare redirect automatico: la Landing si mostra SEMPRE
    // Il controllo sessione avviene solo al click del pulsante
  }

  ngOnDestroy(): void {
    if (this.styleTag) {
      this.styleTag.remove();
      this.styleTag = null;
    }
  }

  entra(): void {
    // Se già autenticato → vai direttamente a /home
    // Se non autenticato → vai al form di login
    if (this.accountService.isAuthenticated()) {
      window.location.href = '/home';
    } else {
      window.location.href = '/login';
    }
  }
}
