import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IPortata, NewPortata } from '../portata.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IPortata for edit and NewPortataFormGroupInput for create.
 */
type PortataFormGroupInput = IPortata | PartialWithRequiredKeyOf<NewPortata>;

type PortataFormDefaults = Pick<NewPortata, 'id'>;

type PortataFormGroupContent = {
  id: FormControl<IPortata['id'] | NewPortata['id']>;
  tipo: FormControl<IPortata['tipo']>;
  nomeDefault: FormControl<IPortata['nomeDefault']>;
  nomePersonalizzato: FormControl<IPortata['nomePersonalizzato']>;
  menu: FormControl<IPortata['menu']>;
};

export type PortataFormGroup = FormGroup<PortataFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class PortataFormService {
  createPortataFormGroup(portata: PortataFormGroupInput = { id: null }): PortataFormGroup {
    const portataRawValue = {
      ...this.getFormDefaults(),
      ...portata,
    };
    return new FormGroup<PortataFormGroupContent>({
      id: new FormControl(
        { value: portataRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      tipo: new FormControl(portataRawValue.tipo, {
        validators: [Validators.required],
      }),
      nomeDefault: new FormControl(portataRawValue.nomeDefault),
      nomePersonalizzato: new FormControl(portataRawValue.nomePersonalizzato),
      menu: new FormControl(portataRawValue.menu, {
        validators: [Validators.required],
      }),
    });
  }

  getPortata(form: PortataFormGroup): IPortata | NewPortata {
    return form.getRawValue() as IPortata | NewPortata;
  }

  resetForm(form: PortataFormGroup, portata: PortataFormGroupInput): void {
    const portataRawValue = { ...this.getFormDefaults(), ...portata };
    form.reset(
      {
        ...portataRawValue,
        id: { value: portataRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): PortataFormDefaults {
    return {
      id: null,
    };
  }
}
