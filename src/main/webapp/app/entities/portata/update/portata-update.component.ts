import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IMenu } from 'app/entities/menu/menu.model';
import { MenuService } from 'app/entities/menu/service/menu.service';
import { TipoPortata } from 'app/entities/enumerations/tipo-portata.model';
import { NomePortataDefault } from 'app/entities/enumerations/nome-portata-default.model';
import { PortataService } from '../service/portata.service';
import { IPortata } from '../portata.model';
import { PortataFormGroup, PortataFormService } from './portata-form.service';

@Component({
  selector: 'jhi-portata-update',
  templateUrl: './portata-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class PortataUpdateComponent implements OnInit {
  isSaving = false;
  portata: IPortata | null = null;
  tipoPortataValues = Object.keys(TipoPortata);
  nomePortataDefaultValues = Object.keys(NomePortataDefault);

  menusSharedCollection: IMenu[] = [];

  protected portataService = inject(PortataService);
  protected portataFormService = inject(PortataFormService);
  protected menuService = inject(MenuService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: PortataFormGroup = this.portataFormService.createPortataFormGroup();

  compareMenu = (o1: IMenu | null, o2: IMenu | null): boolean => this.menuService.compareMenu(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ portata }) => {
      this.portata = portata;
      if (portata) {
        this.updateForm(portata);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const portata = this.portataFormService.getPortata(this.editForm);
    if (portata.id !== null) {
      this.subscribeToSaveResponse(this.portataService.update(portata));
    } else {
      this.subscribeToSaveResponse(this.portataService.create(portata));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IPortata>>): void {
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

  protected updateForm(portata: IPortata): void {
    this.portata = portata;
    this.portataFormService.resetForm(this.editForm, portata);

    this.menusSharedCollection = this.menuService.addMenuToCollectionIfMissing<IMenu>(this.menusSharedCollection, portata.menu);
  }

  protected loadRelationshipsOptions(): void {
    this.menuService
      .query()
      .pipe(map((res: HttpResponse<IMenu[]>) => res.body ?? []))
      .pipe(map((menus: IMenu[]) => this.menuService.addMenuToCollectionIfMissing<IMenu>(menus, this.portata?.menu)))
      .subscribe((menus: IMenu[]) => (this.menusSharedCollection = menus));
  }
}
