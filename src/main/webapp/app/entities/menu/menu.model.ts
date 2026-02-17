import { IUser } from 'app/entities/user/user.model';

export interface IMenu {
  id: string;
  nome?: string | null;
  descrizione?: string | null;
  attivo?: boolean | null;
  templateStyle?: string | null;
  colorePrimario?: string | null;
  coloreSecondario?: string | null;
  fontMenu?: string | null;
  ristoratore?: Pick<IUser, 'id' | 'login'> | null;
}

export type NewMenu = Omit<IMenu, 'id'> & { id: null };
