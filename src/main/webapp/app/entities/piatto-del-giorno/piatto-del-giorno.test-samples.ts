import dayjs from 'dayjs/esm';

import { IPiattoDelGiorno, NewPiattoDelGiorno } from './piatto-del-giorno.model';

export const sampleWithRequiredData: IPiattoDelGiorno = {
  id: 'bc6bcac3-8462-4ae0-bacd-da6201cc4720',
  data: dayjs('2026-02-16'),
  attivo: false,
};

export const sampleWithPartialData: IPiattoDelGiorno = {
  id: 'b0e92ddd-c1db-465e-81a1-03be0fc8f15f',
  data: dayjs('2026-02-16'),
  attivo: false,
  nome: 'uh-huh',
  descrizione: 'fair potentially',
};

export const sampleWithFullData: IPiattoDelGiorno = {
  id: '7dbd1fb2-96d1-40c8-8057-6440e7001799',
  data: dayjs('2026-02-17'),
  attivo: true,
  nome: 'supposing',
  descrizione: 'mutate department however',
  prezzo: 7319.15,
};

export const sampleWithNewData: NewPiattoDelGiorno = {
  data: dayjs('2026-02-17'),
  attivo: false,
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
