import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IMenu, NewMenu } from '../menu.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IMenu for edit and NewMenuFormGroupInput for create.
 */
type MenuFormGroupInput = IMenu | PartialWithRequiredKeyOf<NewMenu>;

type MenuFormDefaults = Pick<NewMenu, 'id' | 'attivo'>;

type MenuFormGroupContent = {
  id: FormControl<IMenu['id'] | NewMenu['id']>;
  nome: FormControl<IMenu['nome']>;
  descrizione: FormControl<IMenu['descrizione']>;
  attivo: FormControl<IMenu['attivo']>;
  templateStyle: FormControl<IMenu['templateStyle']>;
  colorePrimario: FormControl<IMenu['colorePrimario']>;
  coloreSecondario: FormControl<IMenu['coloreSecondario']>;
  fontMenu: FormControl<IMenu['fontMenu']>;
  ristoratore: FormControl<IMenu['ristoratore']>;
};

export type MenuFormGroup = FormGroup<MenuFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class MenuFormService {
  createMenuFormGroup(menu: MenuFormGroupInput = { id: null }): MenuFormGroup {
    const menuRawValue = {
      ...this.getFormDefaults(),
      ...menu,
    };
    return new FormGroup<MenuFormGroupContent>({
      id: new FormControl(
        { value: menuRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      nome: new FormControl(menuRawValue.nome, {
        validators: [Validators.required],
      }),
      descrizione: new FormControl(menuRawValue.descrizione),
      attivo: new FormControl(menuRawValue.attivo, {
        validators: [Validators.required],
      }),
      templateStyle: new FormControl(menuRawValue.templateStyle),
      colorePrimario: new FormControl(menuRawValue.colorePrimario),
      coloreSecondario: new FormControl(menuRawValue.coloreSecondario),
      fontMenu: new FormControl(menuRawValue.fontMenu),
      ristoratore: new FormControl(menuRawValue.ristoratore, {
        validators: [Validators.required],
      }),
    });
  }

  getMenu(form: MenuFormGroup): IMenu | NewMenu {
    return form.getRawValue() as IMenu | NewMenu;
  }

  resetForm(form: MenuFormGroup, menu: MenuFormGroupInput): void {
    const menuRawValue = { ...this.getFormDefaults(), ...menu };
    form.reset(
      {
        ...menuRawValue,
        id: { value: menuRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): MenuFormDefaults {
    return {
      id: null,
      attivo: false,
    };
  }
}
