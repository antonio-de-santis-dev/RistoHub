import { IAllergene } from 'app/entities/allergene/allergene.model';
import { IPortata } from 'app/entities/portata/portata.model';

export interface IProdotto {
  id: string;
  nome?: string | null;
  descrizione?: string | null;
  prezzo?: number | null;
  /**
   * Visibilità nel menu pubblico.
   * true  → il prodotto è mostrato ai clienti (default)
   * false → il prodotto è nascosto nel menu pubblico
   */
  visibile?: boolean | null;
  allergenis?: Pick<IAllergene, 'id'>[] | null;
  portata?: Pick<IPortata, 'id'> | null;
}

export type NewProdotto = Omit<IProdotto, 'id'> & { id: null };
