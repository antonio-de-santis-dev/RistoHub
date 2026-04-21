import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PiattoDelGiornoDTO, PortataConProdottiDTO, ProdottoDTO } from 'app/shared/model/risto.model';

/**
 * Mappa delle traduzioni per una singola entità:
 * {"nome": "Tradotto", "descrizione": "Tradotto", ...}
 */
type CampiTradotti = Record<string, string>;

/**
 * Payload completo parsato dal campo "traduzioni" del backend:
 * { "en": {"nome":"...", "descrizione":"..."}, "fr": {...}, ... }
 */
type TraduzioniPayload = Record<string, CampiTradotti>;

/**
 * Service di traduzione basato su traduzioni pre-calcolate dal backend via DeepL.
 *
 * NON chiama più API esterne (MyMemory/Google) dal browser: legge invece le traduzioni
 * dal campo "traduzioni" (JSON) presente su Prodotto, Portata e PiattoDelGiorno nel
 * payload /api/public/menus/{id}/full.
 *
 * Se il menu contiene entità "legacy" senza traduzioni (create prima dell'introduzione
 * di DeepL), il frontend può chiamare translateMissing(menuId) per far partire una
 * traduzione batch backend-side, dopo la quale un nuovo GET /full restituirà i dati
 * aggiornati.
 *
 * Architettura della cache:
 *   - Lookup O(1) per coppia (lingua, testoItaliano) → testoTradotto
 *   - Costruita parsando i campi JSON delle entità quando il menu viene caricato
 *   - La chiave è il testo italiano ORIGINALE, così getT(testoItaliano) funziona direttamente
 */
@Injectable({ providedIn: 'root' })
export class TraduzioneService {
  // Cache indicizzata per lingua, poi per testo italiano originale
  private cache = new Map<string, Map<string, string>>();

  constructor(private http: HttpClient) {}

  /**
   * Popola la cache partendo dai dati del menu completo.
   * Chiamare subito dopo aver caricato /api/public/menus/{id}/full.
   *
   * Per ogni prodotto/portata/piatto, parsiamo il campo "traduzioni" (se presente)
   * e popoliamo la cache usando come chiave il testo italiano originale.
   *
   * @returns true se ALMENO un'entità ha traduzioni valide, false se tutte sono vuote
   *          (in quel caso il componente può chiamare translateMissing)
   */
  popolaDaDati(
    portate: PortataConProdottiDTO[],
    piattiDelGiorno: PiattoDelGiornoDTO[],
  ): { haTraduzioni: boolean; entitaSenzaTraduzioni: number } {
    let haTraduzioni = false;
    let entitaSenzaTraduzioni = 0;

    // Portate personalizzate
    for (const portata of portate) {
      if (portata.tipo === 'PERSONALIZZATA' && portata.nomePersonalizzato) {
        const payload = this.parseTraduzioni(portata.traduzioni);
        if (payload) {
          haTraduzioni = true;
          this.registraCampiConMapping(payload, { nomePersonalizzato: portata.nomePersonalizzato });
        } else {
          entitaSenzaTraduzioni++;
        }
      }

      // Prodotti della portata
      for (const prod of portata.prodotti ?? []) {
        if (!prod.nome && !prod.descrizione) continue;
        const payload = this.parseTraduzioni(prod.traduzioni);
        if (payload) {
          haTraduzioni = true;
          this.registraCampiConMapping(payload, {
            nome: prod.nome,
            descrizione: prod.descrizione,
          });
        } else {
          entitaSenzaTraduzioni++;
        }
      }
    }

    // Piatti del giorno
    for (const piatto of piattiDelGiorno) {
      // Se ha un prodotto collegato, le traduzioni sono lì (già processato sopra se il
      // prodotto è in una portata; altrimenti le registriamo ora).
      if (piatto.prodotto?.traduzioni) {
        const payload = this.parseTraduzioni(piatto.prodotto.traduzioni);
        if (payload) {
          haTraduzioni = true;
          this.registraCampiConMapping(payload, {
            nome: piatto.prodotto.nome,
            descrizione: piatto.prodotto.descrizione,
          });
        }
        continue;
      }

      // Piatto personalizzato: traduzioni direttamente sul piatto
      const testoNome = piatto.nome;
      const testoDesc = piatto.descrizione;
      if (!testoNome && !testoDesc) continue;
      const payload = this.parseTraduzioni(piatto.traduzioni);
      if (payload) {
        haTraduzioni = true;
        this.registraCampiConMapping(payload, { nome: testoNome, descrizione: testoDesc });
      } else {
        entitaSenzaTraduzioni++;
      }
    }

    return { haTraduzioni, entitaSenzaTraduzioni };
  }

  /**
   * Registra nella cache ogni coppia (testoItalianoOriginale → testoTradotto) per ogni lingua.
   *
   * @param payload il JSON parsato con {lingua: {campo: traduzione}}
   * @param campiIt mappa {campo: testoItaliano} — es. {nome:"Spaghetti", descrizione:"Con uovo..."}
   */
  private registraCampiConMapping(payload: TraduzioniPayload, campiIt: Record<string, string | undefined | null>): void {
    for (const [lingua, campiTradotti] of Object.entries(payload)) {
      let cacheLingua = this.cache.get(lingua);
      if (!cacheLingua) {
        cacheLingua = new Map<string, string>();
        this.cache.set(lingua, cacheLingua);
      }
      for (const [nomeCampo, testoIt] of Object.entries(campiIt)) {
        if (!testoIt) continue;
        const tradotto = campiTradotti[nomeCampo];
        if (tradotto && tradotto !== testoIt) {
          cacheLingua.set(testoIt, tradotto);
        }
      }
    }
  }

  private parseTraduzioni(json: string | null | undefined): TraduzioniPayload | null {
    if (!json || !json.trim()) return null;
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed === 'object') return parsed as TraduzioniPayload;
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Traduzione singola: cerca nella cache il testo italiano → testo nella lingua target.
   * Se non trovato, ritorna il testo italiano (fallback).
   */
  getTradotto(testoIt: string | undefined | null, lingua: string): string {
    if (!testoIt) return testoIt ?? '';
    if (lingua === 'it') return testoIt;
    return this.cache.get(lingua)?.get(testoIt) ?? testoIt;
  }

  /**
   * Fallback: chiama il backend per tradurre le entità legacy del menu.
   * Dopo la chiamata, il componente deve ricaricare /full per ottenere le traduzioni
   * aggiornate. Ritorna il numero di entità tradotte.
   */
  async translateMissing(menuId: string): Promise<number> {
    try {
      const result = await firstValueFrom(
        this.http.post<{ tradotti: number; attivo: boolean; messaggio?: string }>(`/api/public/menus/${menuId}/translate-missing`, {}),
      );
      return result?.tradotti ?? 0;
    } catch (e) {
      console.warn('Errore chiamata translate-missing:', e);
      return 0;
    }
  }

  /**
   * Compat con i componenti esistenti: ritorna la Map per una lingua (usata da getT()).
   * Ora è semplicemente la cache interna.
   */
  getCached(lingua: string): Map<string, string> | undefined {
    return this.cache.get(lingua);
  }

  /**
   * Compat: indica se tutte le stringhe passate hanno una traduzione in cache.
   * Con il nuovo flusso (dati pre-tradotti nel payload) è praticamente sempre true
   * dopo popolaDaDati, a meno di entità legacy.
   */
  hasAllCached(testi: string[], lingua: string): boolean {
    const cacheLingua = this.cache.get(lingua);
    if (!cacheLingua) return false;
    for (const t of testi) {
      if (t && t.trim().length > 0 && !cacheLingua.has(t)) return false;
    }
    return true;
  }

  hasCached(lingua: string): boolean {
    const c = this.cache.get(lingua);
    return !!c && c.size > 0;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
