import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IUser } from 'app/entities/user/user.model';
import { UserService } from 'app/entities/user/service/user.service';
import { IMenu } from '../menu.model';
import { MenuService } from '../service/menu.service';
import { MenuFormGroup, MenuFormService } from './menu-form.service';

@Component({
  selector: 'jhi-menu-update',
  templateUrl: './menu-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class MenuUpdateComponent implements OnInit {
  isSaving = false;
  menu: IMenu | null = null;

  usersSharedCollection: IUser[] = [];

  protected menuService = inject(MenuService);
  protected menuFormService = inject(MenuFormService);
  protected userService = inject(UserService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: MenuFormGroup = this.menuFormService.createMenuFormGroup();

  compareUser = (o1: IUser | null, o2: IUser | null): boolean => this.userService.compareUser(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ menu }) => {
      this.menu = menu;
      if (menu) {
        this.updateForm(menu);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const menu = this.menuFormService.getMenu(this.editForm);
    if (menu.id !== null) {
      this.subscribeToSaveResponse(this.menuService.update(menu));
    } else {
      this.subscribeToSaveResponse(this.menuService.create(menu));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IMenu>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(menu: IMenu): void {
    this.menu = menu;
    this.menuFormService.resetForm(this.editForm, menu);

    this.usersSharedCollection = this.userService.addUserToCollectionIfMissing<IUser>(this.usersSharedCollection, menu.ristoratore);
  }

  protected loadRelationshipsOptions(): void {
    this.userService
      .query()
      .pipe(map((res: HttpResponse<IUser[]>) => res.body ?? []))
      .pipe(map((users: IUser[]) => this.userService.addUserToCollectionIfMissing<IUser>(users, this.menu?.ristoratore)))
      .subscribe((users: IUser[]) => (this.usersSharedCollection = users));
  }
}
