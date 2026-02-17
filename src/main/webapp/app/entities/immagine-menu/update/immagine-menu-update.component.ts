import { Component, ElementRef, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AlertError } from 'app/shared/alert/alert-error.model';
import { EventManager, EventWithContent } from 'app/core/util/event-manager.service';
import { DataUtils, FileLoadError } from 'app/core/util/data-util.service';
import { IMenu } from 'app/entities/menu/menu.model';
import { MenuService } from 'app/entities/menu/service/menu.service';
import { TipoImmagine } from 'app/entities/enumerations/tipo-immagine.model';
import { ImmagineMenuService } from '../service/immagine-menu.service';
import { IImmagineMenu } from '../immagine-menu.model';
import { ImmagineMenuFormGroup, ImmagineMenuFormService } from './immagine-menu-form.service';

@Component({
  selector: 'jhi-immagine-menu-update',
  templateUrl: './immagine-menu-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ImmagineMenuUpdateComponent implements OnInit {
  isSaving = false;
  immagineMenu: IImmagineMenu | null = null;
  tipoImmagineValues = Object.keys(TipoImmagine);

  menusSharedCollection: IMenu[] = [];

  protected dataUtils = inject(DataUtils);
  protected eventManager = inject(EventManager);
  protected immagineMenuService = inject(ImmagineMenuService);
  protected immagineMenuFormService = inject(ImmagineMenuFormService);
  protected menuService = inject(MenuService);
  protected elementRef = inject(ElementRef);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ImmagineMenuFormGroup = this.immagineMenuFormService.createImmagineMenuFormGroup();

  compareMenu = (o1: IMenu | null, o2: IMenu | null): boolean => this.menuService.compareMenu(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ immagineMenu }) => {
      this.immagineMenu = immagineMenu;
      if (immagineMenu) {
        this.updateForm(immagineMenu);
      }

      this.loadRelationshipsOptions();
    });
  }

  byteSize(base64String: string): string {
    return this.dataUtils.byteSize(base64String);
  }

  openFile(base64String: string, contentType: string | null | undefined): void {
    this.dataUtils.openFile(base64String, contentType);
  }

  setFileData(event: Event, field: string, isImage: boolean): void {
    this.dataUtils.loadFileToForm(event, this.editForm, field, isImage).subscribe({
      error: (err: FileLoadError) =>
        this.eventManager.broadcast(new EventWithContent<AlertError>('ristoHubApp.error', { ...err, key: `error.file.${err.key}` })),
    });
  }

  clearInputImage(field: string, fieldContentType: string, idInput: string): void {
    this.editForm.patchValue({
      [field]: null,
      [fieldContentType]: null,
    });
    if (idInput && this.elementRef.nativeElement.querySelector(`#${idInput}`)) {
      this.elementRef.nativeElement.querySelector(`#${idInput}`).value = null;
    }
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const immagineMenu = this.immagineMenuFormService.getImmagineMenu(this.editForm);
    if (immagineMenu.id !== null) {
      this.subscribeToSaveResponse(this.immagineMenuService.update(immagineMenu));
    } else {
      this.subscribeToSaveResponse(this.immagineMenuService.create(immagineMenu));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IImmagineMenu>>): void {
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

  protected updateForm(immagineMenu: IImmagineMenu): void {
    this.immagineMenu = immagineMenu;
    this.immagineMenuFormService.resetForm(this.editForm, immagineMenu);

    this.menusSharedCollection = this.menuService.addMenuToCollectionIfMissing<IMenu>(this.menusSharedCollection, immagineMenu.menu);
  }

  protected loadRelationshipsOptions(): void {
    this.menuService
      .query()
      .pipe(map((res: HttpResponse<IMenu[]>) => res.body ?? []))
      .pipe(map((menus: IMenu[]) => this.menuService.addMenuToCollectionIfMissing<IMenu>(menus, this.immagineMenu?.menu)))
      .subscribe((menus: IMenu[]) => (this.menusSharedCollection = menus));
  }
}
