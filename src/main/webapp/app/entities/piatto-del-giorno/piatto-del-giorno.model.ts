import dayjs from 'dayjs/esm';
import { IProdotto } from 'app/entities/prodotto/prodotto.model';

export interface IPiattoDelGiorno {
  id: string;
  data?: dayjs.Dayjs | null;
  attivo?: boolean | null;
  nome?: string | null;
  descrizione?: string | null;
  prezzo?: number | null;
  prodotto?: Pick<IProdotto, 'id'> | null;
}

export type NewPiattoDelGiorno = Omit<IPiattoDelGiorno, 'id'> & { id: null };
