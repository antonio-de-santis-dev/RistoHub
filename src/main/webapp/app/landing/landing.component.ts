import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

  /** true → attiva animazione restringimento card, poi naviga a /login */
  showLogin = false;

  constructor(
    private accountService: AccountService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Nasconde navbar e footer
    this.styleTag = document.createElement('style');
    this.styleTag.id = 'landing-hide-navbar';
    this.styleTag.textContent = `
      jhi-navbar, nav.navbar,
      jhi-footer, footer,
      router-outlet[name="navbar"] ~ * {
        display: none !important;
      }
    `;
    document.head.appendChild(this.styleTag);

    // Se già autenticato → home
    this.accountService.identity().subscribe(() => {
      if (this.accountService.isAuthenticated()) {
        this.router.navigate(['/home']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.styleTag) {
      this.styleTag.remove();
      this.styleTag = null;
    }
  }

  /**
   * Click su "Get started":
   * — già autenticato → /home direttamente
   * — non autenticato → animazione card (550ms) poi naviga a /login
   */
  mostraLogin(): void {
    if (this.accountService.isAuthenticated()) {
      this.router.navigate(['/home']);
    } else {
      // Avvia animazione: testo sparisce, card si riduce
      this.showLogin = true;
      // Naviga a /login dopo che l'animazione è completata
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 550);
    }
  }
}
