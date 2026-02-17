import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IPiattoDelGiorno, NewPiattoDelGiorno } from '../piatto-del-giorno.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IPiattoDelGiorno for edit and NewPiattoDelGiornoFormGroupInput for create.
 */
type PiattoDelGiornoFormGroupInput = IPiattoDelGiorno | PartialWithRequiredKeyOf<NewPiattoDelGiorno>;

type PiattoDelGiornoFormDefaults = Pick<NewPiattoDelGiorno, 'id' | 'attivo'>;

type PiattoDelGiornoFormGroupContent = {
  id: FormControl<IPiattoDelGiorno['id'] | NewPiattoDelGiorno['id']>;
  data: FormControl<IPiattoDelGiorno['data']>;
  attivo: FormControl<IPiattoDelGiorno['attivo']>;
  nome: FormControl<IPiattoDelGiorno['nome']>;
  descrizione: FormControl<IPiattoDelGiorno['descrizione']>;
  prezzo: FormControl<IPiattoDelGiorno['prezzo']>;
  prodotto: FormControl<IPiattoDelGiorno['prodotto']>;
};

export type PiattoDelGiornoFormGroup = FormGroup<PiattoDelGiornoFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class PiattoDelGiornoFormService {
  createPiattoDelGiornoFormGroup(piattoDelGiorno: PiattoDelGiornoFormGroupInput = { id: null }): PiattoDelGiornoFormGroup {
    const piattoDelGiornoRawValue = {
      ...this.getFormDefaults(),
      ...piattoDelGiorno,
    };
    return new FormGroup<PiattoDelGiornoFormGroupContent>({
      id: new FormControl(
        { value: piattoDelGiornoRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      data: new FormControl(piattoDelGiornoRawValue.data, {
        validators: [Validators.required],
      }),
      attivo: new FormControl(piattoDelGiornoRawValue.attivo, {
        validators: [Validators.required],
      }),
      nome: new FormControl(piattoDelGiornoRawValue.nome),
      descrizione: new FormControl(piattoDelGiornoRawValue.descrizione),
      prezzo: new FormControl(piattoDelGiornoRawValue.prezzo),
      prodotto: new FormControl(piattoDelGiornoRawValue.prodotto),
    });
  }

  getPiattoDelGiorno(form: PiattoDelGiornoFormGroup): IPiattoDelGiorno | NewPiattoDelGiorno {
    return form.getRawValue() as IPiattoDelGiorno | NewPiattoDelGiorno;
  }

  resetForm(form: PiattoDelGiornoFormGroup, piattoDelGiorno: PiattoDelGiornoFormGroupInput): void {
    const piattoDelGiornoRawValue = { ...this.getFormDefaults(), ...piattoDelGiorno };
    form.reset(
      {
        ...piattoDelGiornoRawValue,
        id: { value: piattoDelGiornoRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): PiattoDelGiornoFormDefaults {
    return {
      id: null,
      attivo: false,
    };
  }
}
