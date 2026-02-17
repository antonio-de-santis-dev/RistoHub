import { IImmagineMenu, NewImmagineMenu } from './immagine-menu.model';

export const sampleWithRequiredData: IImmagineMenu = {
  id: '3ebb7132-322b-44a2-8776-ef9fe5e88fcb',
  immagine: '../fake-data/blob/hipster.png',
  immagineContentType: 'unknown',
  tipo: 'VETRINA',
};

export const sampleWithPartialData: IImmagineMenu = {
  id: '2cbb2fb5-b6fb-4145-829e-b4c2e2db30d1',
  nome: 'neaten',
  immagine: '../fake-data/blob/hipster.png',
  immagineContentType: 'unknown',
  contentType: 'intelligent instantly',
  tipo: 'VETRINA',
};

export const sampleWithFullData: IImmagineMenu = {
  id: '8338591d-3395-4cf6-a270-241b72d79567',
  nome: 'important',
  immagine: '../fake-data/blob/hipster.png',
  immagineContentType: 'unknown',
  contentType: 'sesame',
  tipo: 'LOGO',
};

export const sampleWithNewData: NewImmagineMenu = {
  immagine: '../fake-data/blob/hipster.png',
  immagineContentType: 'unknown',
  tipo: 'LOGO',
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
