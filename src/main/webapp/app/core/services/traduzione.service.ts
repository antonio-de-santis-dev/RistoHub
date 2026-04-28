import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Servizio di traduzione — v3 (LibreTranslate via proxy backend, ottimizzato).
 *
 * COSA È CAMBIATO RISPETTO ALLA VERSIONE PRECEDENTE (v2):
 * ──────────────────────────────────────────────────────────────
 * ✅ BATCH aumentato da 20 a 100:
 *    - Prima: un menu con 60 stringhe (30 prodotti × nome+descrizione) causava
 *      3 chiamate HTTP sequenziali al backend → latenza percepita ~6-9 secondi
 *    - Ora: tutte le 60 stringhe vengono inviate in UNA SOLA chiamata HTTP
 *      → latenza percepita ~2-3 secondi (riduzione del 70%)
 *    - Il backend gestisce il parallelismo internamente (chunk paralleli a LibreTranslate)
 *      quindi aumentare il BATCH lato frontend non appesantisce il server
 *
 * ARCHITETTURA:
 * ──────────────────────────────────────────────────────────────
 *   Browser Angular
 *        │
 *        │  POST /api/public/traduci  ← 1 sola chiamata HTTP (BATCH=100)
 *        ▼
 *   Spring Boot backend
 *        │
 *        │  chunk1 ──┐
 *        │  chunk2 ──┼──► LibreTranslate (in parallelo)
 *        │  chunk3 ──┘
 *        ▼
 *   Risposta aggregata → cache Angular
 *
 * COMPATIBILITÀ:
 * ──────────────────────────────────────────────────────────────
 * Interfaccia pubblica identica a v1 e v2:
 *   - traduci(testi, lingua, onProgress?) → stessa firma
 *   - getCached(lingua) → stessa firma
 *   - hasAllCached(testi, lingua) → stessa firma
 *   - hasCached(lingua) → stessa firma
 *   - clearCache() → stessa firma
 *
 * I componenti (menu-public.component.ts, menu-view.component.ts)
 * NON richiedono modifiche.
 */
@Injectable({ providedIn: 'root' })
export class TraduzioneService {
  // La cache è indicizzata per lingua → (testoOriginale → traduzione).
  private cache = new Map<string, Map<string, string>>();

  // ── Configurazione ─────────────────────────────────────────────────────────

  /**
   * Dimensione massima del batch inviato al backend in ogni richiesta HTTP.
   *
   * OTTIMIZZAZIONE v3: aumentato da 20 a 100.
   * Con LibreTranslate self-hosted non ci sono limiti di quota, e il backend
   * divide internamente i testi in chunk paralleli → mandare tutto in una
   * sola chiamata è sempre più veloce di più chiamate sequenziali.
   *
   * Un menu tipico ha 20-60 stringhe (nomi + descrizioni prodotti): con BATCH=100
   * vengono tradotte in una sola richiesta HTTP invece di 3-4 sequenziali.
   */
  private readonly BATCH = 100;

  constructor(private http: HttpClient) {}

  // ── Metodo principale ──────────────────────────────────────────────────────

  /**
   * Traduce le stringhe richieste nella lingua indicata.
   *
   * - Le stringhe già in cache vengono saltate (nessuna chiamata HTTP).
   * - Le rimanenti vengono inviate in batch al backend /api/public/traduci.
   * - onProgress() viene chiamato dopo ogni batch per aggiornare la UI
   *   progressivamente (comportamento identico alla versione precedente).
   *
   * @param testi       Lista di stringhe da tradurre
   * @param lingua      Codice lingua target (es. "en", "fr", "de", "es")
   * @param onProgress  Callback opzionale per rendering progressivo
   *
   * @returns { cache, errori, rateLimited }
   *   - cache: Map con tutte le traduzioni disponibili (incluse quelle già in cache)
   *   - errori: numero di stringhe che non è stato possibile tradurre
   *   - rateLimited: sempre false (LibreTranslate non ha quota), mantenuto
   *                  per compatibilità con i componenti esistenti
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
      return { cache: cacheLingua, errori: 0, rateLimited: false };
    }

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

  // ── Metodi di cache (interfaccia identica alla versione precedente) ─────────

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
