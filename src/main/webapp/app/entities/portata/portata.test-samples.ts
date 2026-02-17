import { IPortata, NewPortata } from './portata.model';

export const sampleWithRequiredData: IPortata = {
  id: 'c913f3d2-2e0f-4db4-8027-1c7f3d31fd37',
  tipo: 'PERSONALIZZATA',
};

export const sampleWithPartialData: IPortata = {
  id: '217428ab-8f5b-4637-abc7-f8ad75a85d1c',
  tipo: 'DEFAULT',
};

export const sampleWithFullData: IPortata = {
  id: 'c541c6bc-7c75-440d-a7d2-809b4cfcc089',
  tipo: 'DEFAULT',
  nomeDefault: 'PRIMO',
  nomePersonalizzato: 'understanding so barring',
};

export const sampleWithNewData: NewPortata = {
  tipo: 'PERSONALIZZATA',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
