import { IAllergene, NewAllergene } from './allergene.model';

export const sampleWithRequiredData: IAllergene = {
  id: 'affdb1ab-ec1a-4837-bd4b-64d2813db672',
  nome: 'ordinary towards',
};

export const sampleWithPartialData: IAllergene = {
  id: '0a215c7e-9c89-4a6c-8b6e-c7cfb0a2adc8',
  nome: 'inveigle brr astride',
  simbolo: 'convalesce prudent softly',
};

export const sampleWithFullData: IAllergene = {
  id: 'afbd8884-388b-4364-8fa8-35d285269d81',
  nome: 'than obnoxiously ugh',
  simbolo: 'whoever phew space',
};

export const sampleWithNewData: NewAllergene = {
  nome: 'meanwhile seal',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
