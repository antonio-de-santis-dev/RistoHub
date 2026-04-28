// ── Allergene ─────────────────────────────────────────────────────────────────

export interface AllergeneDTO {
  id: string;
  nome?: string;
  icona?: string;
  iconaContentType?: string;
  colore?: string;
}

// ── Prodotto ──────────────────────────────────────────────────────────────────

/**
 * Mappa delle traduzioni pre-calcolate di un prodotto.
 *
 * Struttura:
 *   { "en": { "nome": "Grilled octopus", "descrizione": "With potatoes" },
 *     "fr": { "nome": "Poulpe grillé",   "descrizione": "Avec pommes de terre" },
 *     ... }
 *
 * Null o oggetto vuoto = nessuna traduzione disponibile nel DB.
 * In quel caso il frontend chiamerà LibreTranslate on-demand.
 */
export type TraduzioniProdotto = Record<string, { nome?: string; descrizione?: string }>;

export interface ProdottoDTO {
  id: string;
  nome: string;
  descrizione?: string;
  prezzo: number;
  allergenis?: AllergeneDTO[];
  portata?: { id: string };
  visibile?: boolean;
  /** Traduzioni pre-calcolate dal backend — usate dal TraduzioneService per evitare chiamate a LibreTranslate. */
  traduzioni?: TraduzioniProdotto;
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
}

export interface PortataConProdottiDTO {
  id: string;
  tipo: TipoPortata;
  nomeDefault?: string;
  nomePersonalizzato?: string;
  prodotti: ProdottoDTO[];
}

// ── Menu ──────────────────────────────────────────────────────────────────────

export interface MenuDTO {
  id: string;
  nome?: string;
  descrizione?: string;
  attivo?: boolean;
  qrCodeUrl?: string;
}

// ── Immagine ──────────────────────────────────────────────────────────────────

export interface ImmagineMenuMetaDTO {
  id: string;
  contentUrl: string;
  ordine?: number;
  tipo?: string;
}

// ── Piatto del giorno ─────────────────────────────────────────────────────────

export interface PiattoDelGiornoDTO {
  id: string;
  attivo?: boolean;
  nomePersonalizzato?: string;
  descrizionePersonalizzata?: string;
  prezzoPersonalizzato?: number;
  prodotto?: ProdottoDTO;
  allergenis?: AllergeneDTO[];
}

// ── Lista contatti ────────────────────────────────────────────────────────────

export interface ContattoDTO {
  id: string;
  tipo?: string;
  valore?: string;
  reteSociale?: string;
  etichetta?: string;
  ordine?: number;
}

export interface ListaContattiDTO {
  id: string;
  nome?: string;
  contatti?: ContattoDTO[];
}

// ── Menu completo (risposta pubblica aggregata) ────────────────────────────────

export interface MenuCompletoDTO {
  menu: MenuDTO;
  portate: PortataConProdottiDTO[];
  piattiDelGiorno: PiattoDelGiornoDTO[];
  immagini: ImmagineMenuMetaDTO[];
  allergeni: AllergeneDTO[];
  contatti: ListaContattiDTO[];
}
