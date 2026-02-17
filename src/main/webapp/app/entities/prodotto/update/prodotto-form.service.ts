import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IProdotto, NewProdotto } from '../prodotto.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IProdotto for edit and NewProdottoFormGroupInput for create.
 */
type ProdottoFormGroupInput = IProdotto | PartialWithRequiredKeyOf<NewProdotto>;

type ProdottoFormDefaults = Pick<NewProdotto, 'id' | 'allergenis'>;

type ProdottoFormGroupContent = {
  id: FormControl<IProdotto['id'] | NewProdotto['id']>;
  nome: FormControl<IProdotto['nome']>;
  descrizione: FormControl<IProdotto['descrizione']>;
  prezzo: FormControl<IProdotto['prezzo']>;
  allergenis: FormControl<IProdotto['allergenis']>;
  portata: FormControl<IProdotto['portata']>;
};

export type ProdottoFormGroup = FormGroup<ProdottoFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ProdottoFormService {
  createProdottoFormGroup(prodotto: ProdottoFormGroupInput = { id: null }): ProdottoFormGroup {
    const prodottoRawValue = {
      ...this.getFormDefaults(),
      ...prodotto,
    };
    return new FormGroup<ProdottoFormGroupContent>({
      id: new FormControl(
        { value: prodottoRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      nome: new FormControl(prodottoRawValue.nome, {
        validators: [Validators.required],
      }),
      descrizione: new FormControl(prodottoRawValue.descrizione),
      prezzo: new FormControl(prodottoRawValue.prezzo, {
        validators: [Validators.required],
      }),
      allergenis: new FormControl(prodottoRawValue.allergenis ?? []),
      portata: new FormControl(prodottoRawValue.portata, {
        validators: [Validators.required],
      }),
    });
  }

  getProdotto(form: ProdottoFormGroup): IProdotto | NewProdotto {
    return form.getRawValue() as IProdotto | NewProdotto;
  }

  resetForm(form: ProdottoFormGroup, prodotto: ProdottoFormGroupInput): void {
    const prodottoRawValue = { ...this.getFormDefaults(), ...prodotto };
    form.reset(
      {
        ...prodottoRawValue,
        id: { value: prodottoRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ProdottoFormDefaults {
    return {
      id: null,
      allergenis: [],
    };
  }
}
