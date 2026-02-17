import { IProdotto } from 'app/entities/prodotto/prodotto.model';

export interface IAllergene {
  id: string;
  nome?: string | null;
  simbolo?: string | null;
  prodottos?: Pick<IProdotto, 'id'>[] | null;
}

export type NewAllergene = Omit<IAllergene, 'id'> & { id: null };
