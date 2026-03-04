import { Component, Injector, OnInit, Signal, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { Account } from 'app/core/auth/account.model';
import { LANGUAGES } from 'app/config/language.constants';
import { PasswordService } from '../password/password.service';

const initialAccount: Account = {} as Account;

type Section = 'overview' | 'edit' | 'password';

@Component({
  selector: 'jhi-settings',
  imports: [SharedModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export default class SettingsComponent implements OnInit {
  // ── Navigazione interna ──────────────────────────────
  activeSection = signal<Section>('overview');

  // ── Profilo ──────────────────────────────────────────
  success = signal(false);
  languages = LANGUAGES;

  settingsForm = new FormGroup({
    firstName: new FormControl(initialAccount.firstName, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(1), Validators.maxLength(50)],
    }),
    lastName: new FormControl(initialAccount.lastName, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(1), Validators.maxLength(50)],
    }),
    email: new FormControl(initialAccount.email, {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(254), Validators.email],
    }),
    langKey: new FormControl(initialAccount.langKey, { nonNullable: true }),
    activated: new FormControl(initialAccount.activated, { nonNullable: true }),
    authorities: new FormControl(initialAccount.authorities, { nonNullable: true }),
    imageUrl: new FormControl(initialAccount.imageUrl, { nonNullable: true }),
    login: new FormControl(initialAccount.login, { nonNullable: true }),
  });

  // ── Password ─────────────────────────────────────────
  pwDoNotMatch = signal(false);
  pwError = signal(false);
  pwSuccess = signal(false);
  account?: Signal<Account | undefined | null>;

  passwordForm = new FormGroup({
    currentPassword: new FormControl('', { nonNullable: true, validators: Validators.required }),
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4), Validators.maxLength(50)],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(4), Validators.maxLength(50)],
    }),
  });

  private readonly accountService = inject(AccountService);
  private readonly translateService = inject(TranslateService);
  private readonly passwordService = inject(PasswordService);
  private readonly injector = inject(Injector);

  ngOnInit(): void {
    this.account = toSignal(this.accountService.identity(), { injector: this.injector });
    this.accountService.identity().subscribe(account => {
      if (account) this.settingsForm.patchValue(account);
    });
  }

  goTo(section: Section): void {
    this.activeSection.set(section);
    this.success.set(false);
    this.pwSuccess.set(false);
    this.pwError.set(false);
    this.pwDoNotMatch.set(false);
  }

  save(): void {
    this.success.set(false);
    const account = this.settingsForm.getRawValue();
    this.accountService.save(account).subscribe(() => {
      this.success.set(true);
      this.accountService.authenticate(account);
      if (account.langKey !== this.translateService.currentLang) {
        this.translateService.use(account.langKey);
      }
    });
  }

  changePassword(): void {
    this.pwError.set(false);
    this.pwSuccess.set(false);
    this.pwDoNotMatch.set(false);
    const { newPassword, confirmPassword, currentPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.pwDoNotMatch.set(true);
    } else {
      this.passwordService.save(newPassword, currentPassword).subscribe({
        next: () => {
          this.pwSuccess.set(true);
          this.passwordForm.reset();
        },
        error: () => this.pwError.set(true),
      });
    }
  }
}
