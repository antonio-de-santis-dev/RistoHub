import { AfterViewInit, Component, DestroyRef, ElementRef, OnInit, OnDestroy, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { LoginService } from 'app/login/login.service';
import { AccountService } from 'app/core/auth/account.service';
import { LoaderService } from 'app/shared/loader/loader.service';
import { PasswordResetInitService } from 'app/account/password-reset/init/password-reset-init.service';

@Component({
  selector: 'jhi-login',
  imports: [SharedModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export default class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  username = viewChild.required<ElementRef>('username');

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
  private readonly loaderService = inject(LoaderService);
  private readonly router = inject(Router);
  private readonly passwordResetInitService = inject(PasswordResetInitService);
  private styleTag: HTMLStyleElement | null = null;
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.styleTag = document.createElement('style');
    this.styleTag.textContent = `
      jhi-navbar, nav.navbar,
      router-outlet[name="navbar"] ~ * { display: none !important; }
    `;
    document.head.appendChild(this.styleTag);

    this.accountService
      .identity()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.accountService.isAuthenticated()) {
          this.router.navigate(['/home']);
        }
      });
  }

  ngAfterViewInit(): void {
    this.username().nativeElement.focus();
  }

  ngOnDestroy(): void {
    if (this.styleTag) {
      this.styleTag.remove();
      this.styleTag = null;
    }
  }

  // ── Metodi login ───────────────────────────────────────────────
  login(): void {
    // Attiviamo il loader manualmente: la sequenza di login coinvolge
    // POST /api/authentication (ora non più skippata) + GET /api/account
    // (ancora skippata come GET silenziosa). Il loader manuale copre
    // l'intera catena finché non arriva la risposta finale.
    this.loaderService.show();
    this.loginService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.loaderService.hide();
        this.authenticationError.set(false);
        if (!this.router.getCurrentNavigation()) {
          this.router.navigate(['/home']);
        }
      },
      error: () => {
        this.loaderService.hide();
        this.authenticationError.set(true);
      },
    });
  }

  // ── Metodi modal recupero password ─────────────────────────────
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
