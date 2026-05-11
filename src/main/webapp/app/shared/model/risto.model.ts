// =============================================
// ENUM E TIPI BASE
// =============================================
export type TipoContatto = 'EMAIL' | 'TELEFONO' | 'INDIRIZZO' | 'SITO_WEB' | 'RETE_SOCIALE';
export type ReteSociale = 'FACEBOOK' | 'INSTAGRAM' | 'WHATSAPP' | 'TELEGRAM' | 'TIKTOK' | 'LINKEDIN';
export type TemplateStyle = 'MODERNO' | 'RUSTICO' | 'CLASSICO';
export type Lingua = 'it' | 'en' | 'fr' | 'de' | 'es' | 'pt' | 'ru' | 'zh' | 'ja';

// =============================================
// DTO PRINCIPALI
// =============================================

// --- Account ---
export interface AccountDTO {
  id?: string;
  login?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  activated?: boolean;
  langKey?: string;
  authorities?: string[];
  imageUrl?: string;
}

// --- Menu ---
export interface MenuDTO {
  id?: number;
  nome?: string;
  descrizione?: string;
  templateStyle?: TemplateStyle;
  colorePrimario?: string;
  coloreSecondario?: string;
  fontMenu?: string;
  ristoratore?: AccountDTO;
  portate?: PortataDTO[];
  immagini?: ImmagineMenuMetaDTO[];
  dataCreazione?: string;
  dataModifica?: string;
  attivo?: boolean; // Aggiunto
  listeContatti?: ListaContattiDTO[]; // Aggiunto
}

// --- Portata ---
export interface PortataDTO {
  id?: number;
  nome?: string;
  descrizione?: string;
  ordine?: number;
  menu?: MenuDTO;
  prodotti?: ProdottoDTO[];
  traduzioni?: { [key: string]: { nome?: string; descrizione?: string } };
}

export interface PortataConProdottiDTO extends PortataDTO {
  prodotti?: ProdottoDTO[];
  aperta?: boolean; // Aggiunto
}

// --- Prodotto ---
export interface ProdottoDTO {
  id?: number;
  nome?: string;
  descrizione?: string;
  prezzo?: number;
  allergene?: AllergeneDTO[];
  categoria?: string;
  immagine?: string;
  immagineContentType?: string;
  ordine?: number;
  traduzioni?: { [key: string]: { nome?: string; descrizione?: string } };
  menu?: MenuDTO;
  attivo?: boolean; // Aggiunto
}

// --- Piatto del Giorno ---
export interface PiattoDelGiornoDTO {
  id?: number;
  nome?: string;
  descrizione?: string;
  prezzo?: number;
  menu?: MenuDTO; // Aggiunto
  prodotto?: ProdottoDTO;
  dataInizio?: string;
  dataFine?: string;
  ordine?: number;
  traduzioni?: { [key: string]: { nome?: string; descrizione?: string } };
  attivo?: boolean; // Aggiunto
}

// --- Contatti ---
export interface ContattoDTO {
  id?: string;
  tipo?: TipoContatto;
  valore?: string;
  etichetta?: string;
  reteSociale?: ReteSociale;
  ordine?: number;
  traduzioni?: { [key: string]: { etichetta?: string; valore?: string } };
}

export interface ContattoItemDTO extends ContattoDTO {}

export interface ListaContattiDTO {
  id?: number;
  nome?: string;
  items?: ContattoItemDTO[]; // Aggiunto
  menuIds?: string[];
  traduzioni?: { [key: string]: { nome?: string } };
}

// --- Immagini Menu ---
export interface ImmagineMenuMetaDTO {
  id?: number;
  nome?: string;
  tipo?: 'COPERTINA' | 'LOGO' | 'SFONDO' | 'ALTRO';
  immagine?: string; // Base64
  immagineContentType?: string;
  visibile?: boolean;
  ordine?: number;
  menu?: MenuDTO;
}

// Alias per compatibilità
export type ImmagineMenuDTO = ImmagineMenuMetaDTO;

// --- Allergeni ---
export interface AllergeneDTO {
  id?: number;
  nome?: string;
  icona?: string;
  iconaContentType?: string;
  colore?: string;
  ordine?: number;
  traduzioni?: { [key: string]: { nome?: string } };
}

export interface AllergeneUI extends AllergeneDTO {
  isCustom?: boolean;
}

// --- Traduzioni ---
export interface TraduzioniProdotto {
  lingua: string;
  nome?: string;
  descrizione?: string;
}

// =============================================
// FORM (per Angular Reactive Forms)
// =============================================
export interface ContattoItemForm {
  id?: string;
  tipo: TipoContatto;
  valore: string;
  etichetta?: string;
  reteSociale?: ReteSociale;
  ordine?: number;
}

export interface ListaContattiForm {
  id?: number;
  nome: string;
  items: ContattoItemForm[];
  menuIds: string[];
}

// =============================================
// ALTRI DTO
// =============================================
export interface ProdottoTradottoDTO extends ProdottoDTO {
  traduzioni: { [key: string]: { nome?: string; descrizione?: string } };
}

export interface MenuPublicDTO extends MenuDTO {
  piattiDelGiorno?: PiattoDelGiornoDTO[];
}

// =============================================
// INTERFACCE LOCALI (per componenti specifici)
// =============================================
export interface ImmagineLocale {
  id?: number;
  dataUrl?: string;
  tipo: string;
  ordine: number;
  visibile?: boolean;
  uploading?: boolean;
  isNew?: boolean;
}

// =============================================
// ESPORTAZIONI (senza duplicati)
// =============================================
export {
  TipoContatto,
  ReteSociale,
  TemplateStyle,
  Lingua,
  AccountDTO,
  MenuDTO,
  PortataDTO,
  PortataConProdottiDTO,
  ProdottoDTO,
  PiattoDelGiornoDTO,
  ContattoDTO,
  ContattoItemDTO,
  ListaContattiDTO,
  ImmagineMenuDTO,
  ImmagineMenuMetaDTO,
  AllergeneDTO,
  AllergeneUI,
  TraduzioniProdotto,
  ContattoItemForm,
  ListaContattiForm,
  ProdottoTradottoDTO,
  MenuPublicDTO,
  ImmagineLocale,
};
