import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IProdotto } from 'app/entities/prodotto/prodotto.model';
import { ProdottoService } from 'app/entities/prodotto/service/prodotto.service';
import { IAllergene } from '../allergene.model';
import { AllergeneService } from '../service/allergene.service';
import { AllergeneFormGroup, AllergeneFormService } from './allergene-form.service';

@Component({
  selector: 'jhi-allergene-update',
  templateUrl: './allergene-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class AllergeneUpdateComponent implements OnInit {
  isSaving = false;
  allergene: IAllergene | null = null;

  prodottosSharedCollection: IProdotto[] = [];

  protected allergeneService = inject(AllergeneService);
  protected allergeneFormService = inject(AllergeneFormService);
  protected prodottoService = inject(ProdottoService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: AllergeneFormGroup = this.allergeneFormService.createAllergeneFormGroup();

  compareProdotto = (o1: IProdotto | null, o2: IProdotto | null): boolean => this.prodottoService.compareProdotto(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ allergene }) => {
      this.allergene = allergene;
      if (allergene) {
        this.updateForm(allergene);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const allergene = this.allergeneFormService.getAllergene(this.editForm);
    if (allergene.id !== null) {
      this.subscribeToSaveResponse(this.allergeneService.update(allergene));
    } else {
      this.subscribeToSaveResponse(this.allergeneService.create(allergene));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IAllergene>>): void {
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

  protected updateForm(allergene: IAllergene): void {
    this.allergene = allergene;
    this.allergeneFormService.resetForm(this.editForm, allergene);

    this.prodottosSharedCollection = this.prodottoService.addProdottoToCollectionIfMissing<IProdotto>(
      this.prodottosSharedCollection,
      ...(allergene.prodottos ?? []),
    );
  }

  protected loadRelationshipsOptions(): void {
    this.prodottoService
      .query()
      .pipe(map((res: HttpResponse<IProdotto[]>) => res.body ?? []))
      .pipe(
        map((prodottos: IProdotto[]) =>
          this.prodottoService.addProdottoToCollectionIfMissing<IProdotto>(prodottos, ...(this.allergene?.prodottos ?? [])),
        ),
      )
      .subscribe((prodottos: IProdotto[]) => (this.prodottosSharedCollection = prodottos));
  }
}
