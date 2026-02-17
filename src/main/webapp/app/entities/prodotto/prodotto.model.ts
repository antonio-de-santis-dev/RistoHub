import { IAllergene } from 'app/entities/allergene/allergene.model';
import { IPortata } from 'app/entities/portata/portata.model';

export interface IProdotto {
  id: string;
  nome?: string | null;
  descrizione?: string | null;
  prezzo?: number | null;
  allergenis?: Pick<IAllergene, 'id'>[] | null;
  portata?: Pick<IPortata, 'id'> | null;
}

export type NewProdotto = Omit<IProdotto, 'id'> & { id: null };
