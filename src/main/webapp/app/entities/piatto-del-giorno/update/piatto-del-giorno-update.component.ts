import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IProdotto } from 'app/entities/prodotto/prodotto.model';
import { ProdottoService } from 'app/entities/prodotto/service/prodotto.service';
import { IPiattoDelGiorno } from '../piatto-del-giorno.model';
import { PiattoDelGiornoService } from '../service/piatto-del-giorno.service';
import { PiattoDelGiornoFormGroup, PiattoDelGiornoFormService } from './piatto-del-giorno-form.service';

@Component({
  selector: 'jhi-piatto-del-giorno-update',
  templateUrl: './piatto-del-giorno-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class PiattoDelGiornoUpdateComponent implements OnInit {
  isSaving = false;
  piattoDelGiorno: IPiattoDelGiorno | null = null;

  prodottosSharedCollection: IProdotto[] = [];

  protected piattoDelGiornoService = inject(PiattoDelGiornoService);
  protected piattoDelGiornoFormService = inject(PiattoDelGiornoFormService);
  protected prodottoService = inject(ProdottoService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: PiattoDelGiornoFormGroup = this.piattoDelGiornoFormService.createPiattoDelGiornoFormGroup();

  compareProdotto = (o1: IProdotto | null, o2: IProdotto | null): boolean => this.prodottoService.compareProdotto(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ piattoDelGiorno }) => {
      this.piattoDelGiorno = piattoDelGiorno;
      if (piattoDelGiorno) {
        this.updateForm(piattoDelGiorno);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const piattoDelGiorno = this.piattoDelGiornoFormService.getPiattoDelGiorno(this.editForm);
    if (piattoDelGiorno.id !== null) {
      this.subscribeToSaveResponse(this.piattoDelGiornoService.update(piattoDelGiorno));
    } else {
      this.subscribeToSaveResponse(this.piattoDelGiornoService.create(piattoDelGiorno));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IPiattoDelGiorno>>): void {
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

  protected updateForm(piattoDelGiorno: IPiattoDelGiorno): void {
    this.piattoDelGiorno = piattoDelGiorno;
    this.piattoDelGiornoFormService.resetForm(this.editForm, piattoDelGiorno);

    this.prodottosSharedCollection = this.prodottoService.addProdottoToCollectionIfMissing<IProdotto>(
      this.prodottosSharedCollection,
      piattoDelGiorno.prodotto,
    );
  }

  protected loadRelationshipsOptions(): void {
    this.prodottoService
      .query()
      .pipe(map((res: HttpResponse<IProdotto[]>) => res.body ?? []))
      .pipe(
        map((prodottos: IProdotto[]) =>
          this.prodottoService.addProdottoToCollectionIfMissing<IProdotto>(prodottos, this.piattoDelGiorno?.prodotto),
        ),
      )
      .subscribe((prodottos: IProdotto[]) => (this.prodottosSharedCollection = prodottos));
  }
}
