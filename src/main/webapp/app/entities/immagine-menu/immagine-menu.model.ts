import { IMenu } from 'app/entities/menu/menu.model';
import { TipoImmagine } from 'app/entities/enumerations/tipo-immagine.model';

export interface IImmagineMenu {
  id: string;
  nome?: string | null;
  immagine?: string | null;
  immagineContentType?: string | null;
  contentType?: string | null;
  tipo?: keyof typeof TipoImmagine | null;
  menu?: Pick<IMenu, 'id'> | null;
}

export type NewImmagineMenu = Omit<IImmagineMenu, 'id'> & { id: null };
