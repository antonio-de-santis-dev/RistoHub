import { IProdotto, NewProdotto } from './prodotto.model';

export const sampleWithRequiredData: IProdotto = {
  id: 'f75b96bf-5e31-4ac6-a5ae-85697ebd6cc9',
  nome: 'or',
  prezzo: 191.16,
};

export const sampleWithPartialData: IProdotto = {
  id: 'c5adb879-7fb8-4216-ae17-43220af3dce8',
  nome: 'unlike subtract',
  descrizione: 'ha with unimpressively',
  prezzo: 22695.18,
};

export const sampleWithFullData: IProdotto = {
  id: 'e4c80be9-d0e4-4c52-b783-ac807d49c82a',
  nome: 'indeed a near',
  descrizione: 'partially eek innocent',
  prezzo: 12930.94,
};

export const sampleWithNewData: NewProdotto = {
  nome: 'pish offset near',
  prezzo: 10680.87,
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
