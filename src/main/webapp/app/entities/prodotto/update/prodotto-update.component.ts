import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IAllergene } from 'app/entities/allergene/allergene.model';
import { AllergeneService } from 'app/entities/allergene/service/allergene.service';
import { IPortata } from 'app/entities/portata/portata.model';
import { PortataService } from 'app/entities/portata/service/portata.service';
import { ProdottoService } from '../service/prodotto.service';
import { IProdotto } from '../prodotto.model';
import { ProdottoFormGroup, ProdottoFormService } from './prodotto-form.service';

@Component({
  selector: 'jhi-prodotto-update',
  templateUrl: './prodotto-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ProdottoUpdateComponent implements OnInit {
  isSaving = false;
  prodotto: IProdotto | null = null;

  allergenesSharedCollection: IAllergene[] = [];
  portatasSharedCollection: IPortata[] = [];

  protected prodottoService = inject(ProdottoService);
  protected prodottoFormService = inject(ProdottoFormService);
  protected allergeneService = inject(AllergeneService);
  protected portataService = inject(PortataService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ProdottoFormGroup = this.prodottoFormService.createProdottoFormGroup();

  compareAllergene = (o1: IAllergene | null, o2: IAllergene | null): boolean => this.allergeneService.compareAllergene(o1, o2);

  comparePortata = (o1: IPortata | null, o2: IPortata | null): boolean => this.portataService.comparePortata(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ prodotto }) => {
      this.prodotto = prodotto;
      if (prodotto) {
        this.updateForm(prodotto);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const prodotto = this.prodottoFormService.getProdotto(this.editForm);
    if (prodotto.id !== null) {
      this.subscribeToSaveResponse(this.prodottoService.update(prodotto));
    } else {
      this.subscribeToSaveResponse(this.prodottoService.create(prodotto));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IProdotto>>): void {
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

  protected updateForm(prodotto: IProdotto): void {
    this.prodotto = prodotto;
    this.prodottoFormService.resetForm(this.editForm, prodotto);

    this.allergenesSharedCollection = this.allergeneService.addAllergeneToCollectionIfMissing<IAllergene>(
      this.allergenesSharedCollection,
      ...(prodotto.allergenis ?? []),
    );
    this.portatasSharedCollection = this.portataService.addPortataToCollectionIfMissing<IPortata>(
      this.portatasSharedCollection,
      prodotto.portata,
    );
  }

  protected loadRelationshipsOptions(): void {
    this.allergeneService
      .query()
      .pipe(map((res: HttpResponse<IAllergene[]>) => res.body ?? []))
      .pipe(
        map((allergenes: IAllergene[]) =>
          this.allergeneService.addAllergeneToCollectionIfMissing<IAllergene>(allergenes, ...(this.prodotto?.allergenis ?? [])),
        ),
      )
      .subscribe((allergenes: IAllergene[]) => (this.allergenesSharedCollection = allergenes));

    this.portataService
      .query()
      .pipe(map((res: HttpResponse<IPortata[]>) => res.body ?? []))
      .pipe(map((portatas: IPortata[]) => this.portataService.addPortataToCollectionIfMissing<IPortata>(portatas, this.prodotto?.portata)))
      .subscribe((portatas: IPortata[]) => (this.portatasSharedCollection = portatas));
  }
}
