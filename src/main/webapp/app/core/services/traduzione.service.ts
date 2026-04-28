import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

/**
 * Servizio di traduzione — v2 (LibreTranslate via proxy backend).
 *
 * COSA È CAMBIATO RISPETTO ALLA VERSIONE PRECEDENTE (MyMemory):
 * ──────────────────────────────────────────────────────────────
 * ❌ Vecchio approccio (MyMemory diretto dal browser):
 *    - Il browser chiamava https://api.mymemory.translated.net direttamente
 *    - Quota 429: ~50.000 parole/giorno per IP+email, si esauriva rapidamente
 *    - CORS gestito solo lato MyMemory (instabile)
 *    - Ogni client browser consumava quota separatamente
 *
 * ✅ Nuovo approccio (LibreTranslate via backend):
 *    - Il browser chiama POST /api/public/traduci sul nostro backend Java
 *    - Il backend Java chiama LibreTranslate (self-hosted → nessuna quota)
 *    - Nessun limite di parole, nessun CORS, nessun 429
 *    - La traduzione passa sempre dall'IP del server (stabile)
 *
 * COMPATIBILITÀ:
 * ──────────────────────────────────────────────────────────────
 * L'interfaccia pubblica è identica alla versione precedente:
 *   - traduci(testi, lingua, onProgress?) → stessa firma
 *   - getCached(lingua) → stessa firma
 *   - hasAllCached(testi, lingua) → stessa firma
 *   - hasCached(lingua) → stessa firma
 *   - clearCache() → stessa firma
 *
 * I componenti (menu-public.component.ts, menu-view.component.ts, ecc.)
 * NON richiedono modifiche: si inietta questo servizio esattamente come prima.
 */
@Injectable({ providedIn: 'root' })
export class TraduzioneService {
  // La cache è indicizzata per lingua → (testoOriginale → traduzione).
  // Stessa struttura della versione precedente per compatibilità.
  private cache = new Map<string, Map<string, string>>();

  // ── Configurazione ─────────────────────────────────────────────────────────

  /**
   * Dimensione del batch inviato al backend in ogni richiesta.
   * Con il backend locale non ci sono limiti stretti, ma batch troppo grandi
   * aumentano la latenza percepita. 20 è un buon compromesso.
   */
  private readonly BATCH = 20;

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

    // Invia le stringhe mancanti in batch al backend
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
          // Conta le stringhe del batch che non sono state tradotte
          errori += batch.filter(t => !risposta.traduzioni[t]).length;
        } else {
          // Il backend ha risposto con ok:false → tutte le stringhe del batch fallite
          errori += batch.length;
          console.warn('[TraduzioneService] Backend ha risposto con errore:', risposta?.errore);
        }
      } catch (err) {
        // Errore HTTP (backend non raggiungibile, timeout, ecc.)
        errori += batch.length;
        console.error('[TraduzioneService] Errore chiamata backend traduci:', err);
      }

      // Aggiorna la UI progressivamente dopo ogni batch (rendering incrementale)
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
