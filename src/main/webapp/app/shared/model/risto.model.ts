// ======================================================
// RISTO MODEL - VERSIONE COMPLETA CORRETTA
// ======================================================

// ------------------------------------------------------
// ACCOUNT
// ------------------------------------------------------

export interface AccountDTO {
  id?: string;
  login?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

// ------------------------------------------------------
// ALLERGENI
// ------------------------------------------------------

export interface AllergeneDTO {
  id: string;
  nome?: string;
  icona?: string;
  iconaContentType?: string;
  colore?: string;
}

export interface AllergeneUI extends AllergeneDTO {
  selected?: boolean;
}

// ------------------------------------------------------
// PRODOTTI
// ------------------------------------------------------

export type TraduzioniProdotto = Record<
  string,
  {
    nome?: string;
    descrizione?: string;
  }
>;

export interface ProdottoDTO {
  id: string;
  nome: string;
  descrizione?: string;
  prezzo: number;

  allergenis?: AllergeneDTO[];

  portata?: {
    id: string;
  };

  visibile?: boolean;

  traduzioni?: TraduzioniProdotto;
}

export interface ProdottoRef {
  id: string;
}

// ------------------------------------------------------
// PORTATE
// ------------------------------------------------------

export type TipoPortata = 'DEFAULT' | 'PERSONALIZZATA';

export interface PortataDTO {
  id: string;
  tipo: TipoPortata;

  nomeDefault?: string;
  nomePersonalizzato?: string;

  menu?: MenuDTO;
}

export interface PortataConProdottiDTO extends PortataDTO {
  prodotti: ProdottoDTO[];

  aperta?: boolean;
}

// ------------------------------------------------------
// MENU
// ------------------------------------------------------

export interface MenuDTO {
  id: string;

  nome?: string;
  descrizione?: string;

  attivo?: boolean;
  qrCodeUrl?: string;

  ristoratore?: AccountDTO;

  templateStyle?: string;

  colorePrimario?: string;
  coloreSecondario?: string;

  fontMenu?: string;
}

// ------------------------------------------------------
// IMMAGINI MENU
// ------------------------------------------------------

export interface ImmagineMenuMetaDTO {
  id: string;
  contentUrl: string;

  ordine?: number;
  tipo?: string;

  visibile?: boolean;
}

export interface ImmagineMenuDTO extends ImmagineMenuMetaDTO {
  contentType?: string;
  data?: any;
}

// ------------------------------------------------------
// PIATTO DEL GIORNO
// ------------------------------------------------------

export interface PiattoDelGiornoDTO {
  id: string;

  attivo?: boolean;

  nome?: string;
  descrizione?: string;
  prezzo?: number;

  nomePersonalizzato?: string;
  descrizionePersonalizzata?: string;
  prezzoPersonalizzato?: number;

  prodotto?: ProdottoDTO;

  allergenis?: AllergeneDTO[];

  menu?: {
    id?: string;
    nome?: string;
  };
}

export interface PiattoDelGiornoBody extends Partial<PiattoDelGiornoDTO> {}

// ------------------------------------------------------
// CONTATTI
// ------------------------------------------------------

export interface ContattoDTO {
  id: string;

  tipo?: string;
  valore?: string;

  reteSociale?: string;

  etichetta?: string;

  ordine?: number;
}

export interface ContattoItemDTO extends ContattoDTO {}

export interface ListaContattiDTO {
  id: string;

  nome?: string;

  contatti?: ContattoDTO[];

  items?: ContattoDTO[];

  menuIds?: string[];
}

// ------------------------------------------------------
// MENU COMPLETO PUBBLICO
// ------------------------------------------------------

export interface MenuCompletoDTO {
  menu: MenuDTO;

  portate: PortataConProdottiDTO[];

  piattiDelGiorno: PiattoDelGiornoDTO[];

  immagini: ImmagineMenuMetaDTO[];

  allergeni: AllergeneDTO[];

  contatti: ListaContattiDTO[];
}
