/**
 * Interfacce TypeScript condivise per il dominio RistoHub.
 * Sostituiscono l'uso di `any` / `any[]` nei componenti personalizzati.
 *
 * Fonte: struttura reale delle risposte API Spring Boot / JHipster.
 */

// ── Utente ────────────────────────────────────────────────────────────────────

export interface AccountDTO {
  id?: string;
  login: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  langKey?: string;
}

// ── Allergene ─────────────────────────────────────────────────────────────────

export interface AllergeneDTO {
  id: string;
  nome: string;
  icona?: string;
  iconaContentType?: string;
  colore?: string;
}

/**
 * Estensione UI-only: usata nei componenti che permettono di creare
 * allergeni custom prima della persistenza (id temporaneo "custom_*").
 */
export interface AllergeneUI extends AllergeneDTO {
  isCustom?: boolean;
}

// ── Prodotto ──────────────────────────────────────────────────────────────────

export interface ProdottoDTO {
  id: string;
  nome: string;
  descrizione?: string;
  prezzo: number;
  allergenis?: AllergeneDTO[];
  portata?: { id: string };
}

/** Riferimento minimo usato nei body delle richieste HTTP */
export interface ProdottoRef {
  id: string;
}

// ── Portata ───────────────────────────────────────────────────────────────────

export type TipoPortata = 'DEFAULT' | 'PERSONALIZZATA';

export interface PortataDTO {
  id: string;
  tipo: TipoPortata;
  nomeDefault?: string;
  nomePersonalizzato?: string;
  menu?: { id: string };
}

/** Portata con i prodotti annidati — usata nell'endpoint aggregato /full */
export interface PortataConProdottiDTO {
  id: string;
  tipo: TipoPortata;
  nomeDefault?: string;
  nomePersonalizzato?: string;
  prodotti: ProdottoDTO[];
  /** Stato UI locale — non viene dal backend */
  aperta?: boolean;
}

// ── Menu ──────────────────────────────────────────────────────────────────────

export interface MenuDTO {
  id: string;
  nome: string;
  descrizione?: string;
  attivo: boolean;
  templateStyle?: string;
  colorePrimario?: string;
  coloreSecondario?: string;
  fontMenu?: string;
  ristoratore?: { id?: string; login: string };
}

// ── Piatto del Giorno ─────────────────────────────────────────────────────────

export interface PiattoDelGiornoDTO {
  id?: string;
  nome?: string;
  descrizione?: string;
  prezzo?: number;
  attivo: boolean;
  prodotto?: ProdottoDTO;
  allergenis?: AllergeneDTO[];
  menu?: { id: string; nome?: string };
}

/**
 * Body usato nelle POST/PUT verso il backend.
 * Usa `null` esplicito per i campi che vanno azzerati,
 * e riferimenti minimi (solo id) per le relazioni.
 */
export interface PiattoDelGiornoBody {
  id?: string;
  attivo: boolean;
  nome?: string | null;
  descrizione?: string | null;
  prezzo?: number | null;
  prodotto?: { id: string } | null;
  allergenis?: { id: string }[];
  menu?: { id: string } | null;
}

// ── Immagine Menu ─────────────────────────────────────────────────────────────

export type TipoImmagine = 'LOGO' | 'COPERTINA';

export interface ImmagineMenuDTO {
  id?: string;
  tipo: TipoImmagine;
  immagine?: string;
  immagineContentType?: string;
  ordine: number;
  visibile: boolean;
  menu?: { id: string };
  /** Solo per nuovi file prima dell'upload — uso locale UI */
  file?: File;
  isNew?: boolean;
}

/** DTO leggero restituito da /full e /immagini — senza byte[]. Usare contentUrl per i byte. */
export interface ImmagineMenuMetaDTO {
  id: string;
  nome?: string;
  immagineContentType?: string;
  tipo: TipoImmagine;
  ordine: number;
  visibile: boolean;
  contentUrl: string;
}

// ── Contatti ──────────────────────────────────────────────────────────────────

export type TipoContatto = 'TELEFONO' | 'EMAIL' | 'SOCIAL' | 'INDIRIZZO';

export interface ContattoItemDTO {
  id: string;
  tipo: TipoContatto;
  valore: string;
  reteSociale?: string;
  etichetta?: string;
  ordine: number;
}

export interface ListaContattiDTO {
  id: string;
  nome: string;
  items: ContattoItemDTO[];
  menuIds?: string[];
}

// ── DTO aggregato /api/public/menus/{id}/full ─────────────────────────────────

export interface MenuCompletoDTO {
  menu: MenuDTO;
  portate: PortataConProdottiDTO[];
  piattiDelGiorno: PiattoDelGiornoDTO[];
  immagini: ImmagineMenuDTO[];
  allergeni: AllergeneDTO[];
  contatti: ListaContattiDTO[];
}
