import { Component, OnInit, OnDestroy, signal, inject, ElementRef, viewChild, AfterViewInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import SharedModule from 'app/shared/shared.module';
import { LoginService } from 'app/login/login.service';
import { AccountService } from 'app/core/auth/account.service';
import { PasswordResetInitService } from 'app/account/password-reset/init/password-reset-init.service';

@Component({
  selector: 'jhi-landing',
  standalone: true,
  imports: [SharedModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, OnDestroy {
  private styleTag: HTMLStyleElement | null = null;

  // BUG-1 FIX: salviamo l'ID del timeout per poterlo cancellare in ngOnDestroy
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  /** true = pannello login visibile */
  showLogin = false;

  // ── Stato login ─────────────────────────────────────────────────
  authenticationError = signal(false);

  loginForm = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rememberMe: new FormControl(false, { nonNullable: true, validators: [Validators.required] }),
  });

  // ── Stato modal recupero password ───────────────────────────────
  mostraModalRecupero = signal(false);
  recuperoSuccess = signal(false);

  resetRequestForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(254), Validators.email],
    }),
  });

  private readonly accountService = inject(AccountService);
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly passwordResetInitService = inject(PasswordResetInitService);

  ngOnInit(): void {
    this.styleTag = document.createElement('style');
    this.styleTag.id = 'landing-hide-navbar';
    this.styleTag.textContent = `
      jhi-navbar, nav.navbar, jhi-footer, footer,
      router-outlet[name="navbar"] ~ * { display: none !important; }
    `;
    document.head.appendChild(this.styleTag);

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
    // BUG-1 FIX: cancella il timeout zombie se il componente viene distrutto
    // prima che i 650 ms scadano (es. utente naviga a /account/register)
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /** Click Get started — su mobile naviga a /login, su desktop mostra form inline */
  apriLogin(): void {
    if (this.accountService.isAuthenticated()) {
      this.router.navigate(['/home']);
    } else if (window.innerWidth < 768) {
      this.router.navigate(['/login']);
    } else {
      this.showLogin = true;
      // BUG-1 FIX: salviamo il riferimento al timeout
      this.timeoutId = setTimeout(() => {
        this.timeoutId = null;
        const el = document.getElementById('username');
        if (el) (el as HTMLInputElement).focus();
      }, 650);
    }
  }

  // ── Login ────────────────────────────────────────────────────────
  login(): void {
    this.loginService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.authenticationError.set(false);
        if (!this.router.getCurrentNavigation()) {
          this.router.navigate(['/home']);
        }
      },
      error: () => this.authenticationError.set(true),
    });
  }

  // ── Modal recupero password ──────────────────────────────────────
  apriRecuperoPassword(): void {
    this.resetRequestForm.reset();
    this.recuperoSuccess.set(false);
    this.mostraModalRecupero.set(true);
  }

  chiudiRecuperoPassword(): void {
    this.mostraModalRecupero.set(false);
    this.recuperoSuccess.set(false);
  }

  chiudiSuOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.chiudiRecuperoPassword();
    }
  }

  requestReset(): void {
    this.passwordResetInitService.save(this.resetRequestForm.get(['email'])!.value).subscribe(() => {
      this.recuperoSuccess.set(true);
      setTimeout(() => this.chiudiRecuperoPassword(), 3000);
    });
  }
}
