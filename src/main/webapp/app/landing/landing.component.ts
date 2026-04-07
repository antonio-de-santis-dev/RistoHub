import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AccountService } from 'app/core/auth/account.service';
import { LoginService } from 'app/login/login.service';
import { PasswordResetInitService } from 'app/account/password-reset/init/password-reset-init.service';

@Component({
  selector: 'jhi-landing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, OnDestroy {
  private styleTag: HTMLStyleElement | null = null;

  // ── Stato UI ───────────────────────────────────────────────────
  showLogin = false;

  // ── Stato login ────────────────────────────────────────────────
  authenticationError = signal(false);

  loginForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rememberMe: new FormControl(false, { nonNullable: true, validators: [Validators.required] }),
  });

  // ── Stato modal recupero password ──────────────────────────────
  mostraModalRecupero = signal(false);
  recuperoSuccess = signal(false);

  resetRequestForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(254), Validators.email],
    }),
  });

  // ── Servizi ────────────────────────────────────────────────────
  private readonly accountService = inject(AccountService);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly passwordResetInitService = inject(PasswordResetInitService);

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

    // Se già autenticato → vai direttamente a /home
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
   * Al click su "Get started":
   * - se già autenticato → naviga a /home
   * - altrimenti → mostra il form di login inline con transizione
   */
  mostraLogin(): void {
    if (this.accountService.isAuthenticated()) {
      this.router.navigate(['/home']);
    } else {
      this.showLogin = true;
      // Focus sull'input username dopo la transizione
      setTimeout(() => {
        const el = document.getElementById('username');
        if (el) el.focus();
      }, 700);
    }
  }

  // ── Metodi login ───────────────────────────────────────────────
  login(): void {
    this.loginService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.authenticationError.set(false);
        this.router.navigate(['/home']);
      },
      error: () => this.authenticationError.set(true),
    });
  }

  // ── Metodi modal recupero password ─────────────────────────────

  /** Apre il modal */
  apriRecuperoPassword(): void {
    this.resetRequestForm.reset();
    this.recuperoSuccess.set(false);
    this.mostraModalRecupero.set(true);
  }

  /** Chiude il modal */
  chiudiRecuperoPassword(): void {
    this.mostraModalRecupero.set(false);
    this.recuperoSuccess.set(false);
  }

  /** Chiude cliccando sull'overlay fuori dalla card */
  chiudiSuOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.chiudiRecuperoPassword();
    }
  }

  /** Invia la richiesta di reset password */
  requestReset(): void {
    this.passwordResetInitService.save(this.resetRequestForm.get(['email'])!.value).subscribe(() => {
      this.recuperoSuccess.set(true);
      setTimeout(() => this.chiudiRecuperoPassword(), 3000);
    });
  }
}
