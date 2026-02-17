import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IImmagineMenu, NewImmagineMenu } from '../immagine-menu.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IImmagineMenu for edit and NewImmagineMenuFormGroupInput for create.
 */
type ImmagineMenuFormGroupInput = IImmagineMenu | PartialWithRequiredKeyOf<NewImmagineMenu>;

type ImmagineMenuFormDefaults = Pick<NewImmagineMenu, 'id'>;

type ImmagineMenuFormGroupContent = {
  id: FormControl<IImmagineMenu['id'] | NewImmagineMenu['id']>;
  nome: FormControl<IImmagineMenu['nome']>;
  immagine: FormControl<IImmagineMenu['immagine']>;
  immagineContentType: FormControl<IImmagineMenu['immagineContentType']>;
  contentType: FormControl<IImmagineMenu['contentType']>;
  tipo: FormControl<IImmagineMenu['tipo']>;
  menu: FormControl<IImmagineMenu['menu']>;
};

export type ImmagineMenuFormGroup = FormGroup<ImmagineMenuFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ImmagineMenuFormService {
  createImmagineMenuFormGroup(immagineMenu: ImmagineMenuFormGroupInput = { id: null }): ImmagineMenuFormGroup {
    const immagineMenuRawValue = {
      ...this.getFormDefaults(),
      ...immagineMenu,
    };
    return new FormGroup<ImmagineMenuFormGroupContent>({
      id: new FormControl(
        { value: immagineMenuRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      nome: new FormControl(immagineMenuRawValue.nome),
      immagine: new FormControl(immagineMenuRawValue.immagine, {
        validators: [Validators.required],
      }),
      immagineContentType: new FormControl(immagineMenuRawValue.immagineContentType),
      contentType: new FormControl(immagineMenuRawValue.contentType),
      tipo: new FormControl(immagineMenuRawValue.tipo, {
        validators: [Validators.required],
      }),
      menu: new FormControl(immagineMenuRawValue.menu, {
        validators: [Validators.required],
      }),
    });
  }

  getImmagineMenu(form: ImmagineMenuFormGroup): IImmagineMenu | NewImmagineMenu {
    return form.getRawValue() as IImmagineMenu | NewImmagineMenu;
  }

  resetForm(form: ImmagineMenuFormGroup, immagineMenu: ImmagineMenuFormGroupInput): void {
    const immagineMenuRawValue = { ...this.getFormDefaults(), ...immagineMenu };
    form.reset(
      {
        ...immagineMenuRawValue,
        id: { value: immagineMenuRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ImmagineMenuFormDefaults {
    return {
      id: null,
    };
  }
}
