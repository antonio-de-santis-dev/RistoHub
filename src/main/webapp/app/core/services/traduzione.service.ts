import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProdottoDTO, TraduzioniProdotto } from '../../shared/model/risto.model';
/**
 * Servizio di traduzione — v4 (DB-first, LibreTranslate come fallback).
 *
 * STRATEGIA:
 * ──────────────────────────────────────────────────────────────
 * 1. Pre-caricamento dal DB:
 *    Quando si riceve la risposta del menu pubblico, le traduzioni sono già
 *    incluse in ogni ProdottoDTO.traduzioni (generato dal backend al salvataggio).
 *    Il metodo precaricaDaDB() popola la cache locale con questi dati.
 *
 * 2. Traduzione on-demand (LibreTranslate):
 *    Se una stringa NON è in cache (es. portate con nome personalizzato, o prodotti
 *    vecchi senza traduzioni nel DB), viene chiamato il backend proxy LibreTranslate.
 *    Con BATCH=100 e parallelismo interno, questo avviene in una sola chiamata HTTP.
 *
 * RISULTATO ATTESO:
 * ──────────────────────────────────────────────────────────────
 * - Prima traduzione: ISTANTANEA (dati già nel DB → nessuna chiamata HTTP aggiuntiva)
 * - Prodotti senza traduzioni nel DB (vecchi): ~2-3 secondi (come v3)
 * - Cambio lingua successivo: ISTANTANEA (tutto in cache Angular)
 *
 * COMPATIBILITÀ:
 * ──────────────────────────────────────────────────────────────
 * Interfaccia pubblica identica a v1, v2 e v3:
 *   - precaricaDaDB(prodotti, lingua) → NUOVO metodo per caricare le traduzioni dal DB
 *   - traduci(testi, lingua, onProgress?) → stessa firma
 *   - getCached(lingua) → stessa firma
 *   - hasAllCached(testi, lingua) → stessa firma
 *   - hasCached(lingua) → stessa firma
 *   - clearCache() → stessa firma
 */
@Injectable({ providedIn: 'root' })
export class TraduzioneService {
  // La cache è indicizzata per lingua → (testoOriginale → traduzione).
  private cache = new Map<string, Map<string, string>>();

  // ── Configurazione ─────────────────────────────────────────────────────────

  /**
   * Dimensione massima del batch inviato al backend in ogni richiesta HTTP.
   * Con BATCH=100 un menu tipico (20-60 stringhe) viene tradotto in 1 sola chiamata.
   */
  private readonly BATCH = 100;

  constructor(private http: HttpClient) {}

  // ── Metodo DB-first ────────────────────────────────────────────────────────

  /**
   * Precarica la cache con le traduzioni già presenti nel DB (campo ProdottoDTO.traduzioni).
   *
   * Chiamare questo metodo subito dopo aver ricevuto la risposta del menu pubblico,
   * PRIMA di chiamare cambiaLingua(). In questo modo, quando l'utente cambia lingua,
   * tutte le traduzioni dei prodotti sono già in cache → nessuna chiamata HTTP.
   *
   * @param prodotti  Lista di prodotti ricevuti dal backend (con il campo traduzioni)
   * @param lingue    Lista di lingue da prelocare (default: tutte le lingue disponibili)
   */
  precaricaDaDB(prodotti: ProdottoDTO[], lingue: string[] = ['en', 'fr', 'de', 'es']): void {
    let count = 0;

    for (const prodotto of prodotti) {
      if (!prodotto.traduzioni) continue;

      for (const lingua of lingue) {
        const traduzioneLingua = prodotto.traduzioni[lingua];
        if (!traduzioneLingua) continue;

        let cacheLingua = this.cache.get(lingua);
        if (!cacheLingua) {
          cacheLingua = new Map<string, string>();
          this.cache.set(lingua, cacheLingua);
        }

        // Carica nome tradotto
        if (prodotto.nome && traduzioneLingua.nome && traduzioneLingua.nome.trim().length > 0) {
          cacheLingua.set(prodotto.nome, traduzioneLingua.nome);
          count++;
        }

        // Carica descrizione tradotta
        if (prodotto.descrizione && traduzioneLingua.descrizione && traduzioneLingua.descrizione.trim().length > 0) {
          cacheLingua.set(prodotto.descrizione, traduzioneLingua.descrizione);
          count++;
        }
      }
    }

    if (count > 0) {
      console.debug(`[TraduzioneService] Precaricate ${count} traduzioni dal DB`);
    }
  }

  // ── Metodo principale ──────────────────────────────────────────────────────

  /**
   * Traduce le stringhe richieste nella lingua indicata.
   *
   * - Le stringhe già in cache (incluse quelle pre-caricate dal DB) vengono saltate.
   * - Le rimanenti vengono inviate in batch al backend /api/public/traduci.
   * - onProgress() viene chiamato dopo ogni batch per aggiornare la UI progressivamente.
   *
   * @param testi       Lista di stringhe da tradurre
   * @param lingua      Codice lingua target (es. "en", "fr", "de", "es")
   * @param onProgress  Callback opzionale per rendering progressivo
   *
   * @returns { cache, errori, rateLimited }
   */
  async traduci(
    testi: string[],
    lingua: string,
    onProgress?: () => void,
  ): Promise<{ cache: Map<string, string>; errori: number; rateLimited: boolean }> {
    let cacheLingua = this.cache.get(lingua);
    if (!cacheLingua) {
      cacheLingua = new Map<string, string>();
      this.cache.set(lingua, cacheLingua);
    }

    const tuttiValidi = testi.filter(s => s && s.trim().length > 0);
    const mancanti = Array.from(new Set(tuttiValidi.filter(s => !cacheLingua!.has(s))));

    let errori = 0;

    if (mancanti.length === 0) {
      // Tutte le stringhe sono già in cache (precaricate dal DB o da chiamate precedenti)
      return { cache: cacheLingua, errori: 0, rateLimited: false };
    }

    console.debug(`[TraduzioneService] ${mancanti.length} stringhe mancanti in cache per '${lingua}', chiamo LibreTranslate`);

    // Invia le stringhe mancanti in batch al backend.
    // Con BATCH=100 un menu tipico viene tradotto in una sola chiamata HTTP.
    for (let i = 0; i < mancanti.length; i += this.BATCH) {
      const batch = mancanti.slice(i, i + this.BATCH);

      try {
        const risposta = await firstValueFrom(
          this.http.post<{ traduzioni: Record<string, string>; ok: boolean; errore?: string }>('/api/public/traduci', {
            testi: batch,
            lingua,
          }),
        );

        if (risposta?.ok && risposta.traduzioni) {
          for (const [originale, tradotto] of Object.entries(risposta.traduzioni)) {
            if (tradotto && tradotto.trim().length > 0) {
              cacheLingua.set(originale, tradotto);
            }
          }
          errori += batch.filter(t => !risposta.traduzioni[t]).length;
        } else {
          errori += batch.length;
          console.warn('[TraduzioneService] Backend ha risposto con errore:', risposta?.errore);
        }
      } catch (err) {
        errori += batch.length;
        console.error('[TraduzioneService] Errore chiamata backend traduci:', err);
      }

      // Aggiorna la UI progressivamente dopo ogni batch
      if (onProgress) {
        onProgress();
      }
    }

    return { cache: cacheLingua, errori, rateLimited: false };
  }

  // ── Metodi di cache ─────────────────────────────────────────────────────────

  /** Restituisce la cache per una lingua (undefined se non ancora popolata). */
  getCached(lingua: string): Map<string, string> | undefined {
    return this.cache.get(lingua);
  }

  /** True se TUTTE le stringhe fornite sono già in cache per quella lingua. */
  hasAllCached(testi: string[], lingua: string): boolean {
    const cacheLingua = this.cache.get(lingua);
    if (!cacheLingua) return false;
    for (const t of testi) {
      if (t && t.trim().length > 0 && !cacheLingua.has(t)) return false;
    }
    return true;
  }

  /** True se la cache per quella lingua contiene almeno un elemento. */
  hasCached(lingua: string): boolean {
    const c = this.cache.get(lingua);
    return !!c && c.size > 0;
  }

  /** Svuota tutta la cache (utile quando cambia il menu). */
  clearCache(): void {
    this.cache.clear();
  }
}
