import { IMenu, NewMenu } from './menu.model';

export const sampleWithRequiredData: IMenu = {
  id: 'c7168157-fc05-46ac-8f79-6dbcbef38277',
  nome: 'gah',
  attivo: false,
};

export const sampleWithPartialData: IMenu = {
  id: '25831c61-e642-407f-89ff-e36d2eaab91d',
  nome: 'probable awesome',
  descrizione: 'blah',
  attivo: false,
  templateStyle: 'under',
  fontMenu: 'schedule',
};

export const sampleWithFullData: IMenu = {
  id: '06362906-f615-4f05-9633-84973115e1a6',
  nome: 'wrong provided however',
  descrizione: 'concerning',
  attivo: true,
  templateStyle: 'furthermore attend',
  colorePrimario: 'bah designation dirty',
  coloreSecondario: 'floss roughly',
  fontMenu: 'lest',
};

export const sampleWithNewData: NewMenu = {
  nome: 'supposing finally',
  attivo: true,
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
