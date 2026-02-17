import { IMenu } from 'app/entities/menu/menu.model';
import { TipoPortata } from 'app/entities/enumerations/tipo-portata.model';
import { NomePortataDefault } from 'app/entities/enumerations/nome-portata-default.model';

export interface IPortata {
  id: string;
  tipo?: keyof typeof TipoPortata | null;
  nomeDefault?: keyof typeof NomePortataDefault | null;
  nomePersonalizzato?: string | null;
  menu?: Pick<IMenu, 'id'> | null;
}

export type NewPortata = Omit<IPortata, 'id'> & { id: null };
