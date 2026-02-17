import { Component, NgZone, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Data, ParamMap, Router, RouterModule } from '@angular/router';
import { Observable, Subscription, combineLatest, filter, tap } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { SortByDirective, SortDirective, SortService, type SortState, sortStateSignal } from 'app/shared/sort';
import { FormatMediumDatePipe } from 'app/shared/date';
import { FormsModule } from '@angular/forms';
import { DEFAULT_SORT_DATA, ITEM_DELETED_EVENT, SORT } from 'app/config/navigation.constants';
import { IPiattoDelGiorno } from '../piatto-del-giorno.model';
import { EntityArrayResponseType, PiattoDelGiornoService } from '../service/piatto-del-giorno.service';
import { PiattoDelGiornoDeleteDialogComponent } from '../delete/piatto-del-giorno-delete-dialog.component';

@Component({
  selector: 'jhi-piatto-del-giorno',
  templateUrl: './piatto-del-giorno.component.html',
  imports: [RouterModule, FormsModule, SharedModule, SortDirective, SortByDirective, FormatMediumDatePipe],
})
export class PiattoDelGiornoComponent implements OnInit {
  subscription: Subscription | null = null;
  piattoDelGiornos = signal<IPiattoDelGiorno[]>([]);
  isLoading = false;

  sortState = sortStateSignal({});

  public readonly router = inject(Router);
  protected readonly piattoDelGiornoService = inject(PiattoDelGiornoService);
  protected readonly activatedRoute = inject(ActivatedRoute);
  protected readonly sortService = inject(SortService);
  protected modalService = inject(NgbModal);
  protected ngZone = inject(NgZone);

  trackId = (item: IPiattoDelGiorno): string => this.piattoDelGiornoService.getPiattoDelGiornoIdentifier(item);

  ngOnInit(): void {
    this.subscription = combineLatest([this.activatedRoute.queryParamMap, this.activatedRoute.data])
      .pipe(
        tap(([params, data]) => this.fillComponentAttributeFromRoute(params, data)),
        tap(() => {
          if (this.piattoDelGiornos().length === 0) {
            this.load();
          } else {
            this.piattoDelGiornos.set(this.refineData(this.piattoDelGiornos()));
          }
        }),
      )
      .subscribe();
  }

  delete(piattoDelGiorno: IPiattoDelGiorno): void {
    const modalRef = this.modalService.open(PiattoDelGiornoDeleteDialogComponent, { size: 'lg', backdrop: 'static' });
    modalRef.componentInstance.piattoDelGiorno = piattoDelGiorno;
    // unsubscribe not needed because closed completes on modal close
    modalRef.closed
      .pipe(
        filter(reason => reason === ITEM_DELETED_EVENT),
        tap(() => this.load()),
      )
      .subscribe();
  }

  load(): void {
    this.queryBackend().subscribe({
      next: (res: EntityArrayResponseType) => {
        this.onResponseSuccess(res);
      },
    });
  }

  navigateToWithComponentValues(event: SortState): void {
    this.handleNavigation(event);
  }

  protected fillComponentAttributeFromRoute(params: ParamMap, data: Data): void {
    this.sortState.set(this.sortService.parseSortParam(params.get(SORT) ?? data[DEFAULT_SORT_DATA]));
  }

  protected onResponseSuccess(response: EntityArrayResponseType): void {
    const dataFromBody = this.fillComponentAttributesFromResponseBody(response.body);
    this.piattoDelGiornos.set(this.refineData(dataFromBody));
  }

  protected refineData(data: IPiattoDelGiorno[]): IPiattoDelGiorno[] {
    const { predicate, order } = this.sortState();
    return predicate && order ? data.sort(this.sortService.startSort({ predicate, order })) : data;
  }

  protected fillComponentAttributesFromResponseBody(data: IPiattoDelGiorno[] | null): IPiattoDelGiorno[] {
    return data ?? [];
  }

  protected queryBackend(): Observable<EntityArrayResponseType> {
    this.isLoading = true;
    const queryObject: any = {
      sort: this.sortService.buildSortParam(this.sortState()),
    };
    return this.piattoDelGiornoService.query(queryObject).pipe(tap(() => (this.isLoading = false)));
  }

  protected handleNavigation(sortState: SortState): void {
    const queryParamsObj = {
      sort: this.sortService.buildSortParam(sortState),
    };

    this.ngZone.run(() => {
      this.router.navigate(['./'], {
        relativeTo: this.activatedRoute,
        queryParams: queryParamsObj,
      });
    });
  }
}
