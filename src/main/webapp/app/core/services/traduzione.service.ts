import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TraduzioneService {
  // La cache è indicizzata per testo ORIGINALE (così i componenti possono
  // fare getCached(lingua).get(prod.nome) senza dover normalizzare lato loro).
  private cache = new Map<string, Map<string, string>>();

  // ── Configurazione ─────────────────────────────────────────────────────────
  //
  // mymemory.translated.net gratis con email: ~50.000 parole/giorno
  // ATTENZIONE: la quota è per IP+email combinati. Quando è esaurita
  // TUTTE le richieste della giornata ricevono 429 → non ha senso ritentare.
  //
  // ⚠️ SOSTITUISCI con la tua email prima del deploy.
  private readonly MYMEMORY_EMAIL = 'boardroom.progetto@gmail.com';

  // BATCH conservativo: 3 richieste parallele per wave.
  // Con BATCH=8 (versione precedente) il retry moltiplicava:
  //   8 stringhe × 4 tentativi (1 + 3 retry) = 32 richieste per onda
  //   → quota bruciata in pochi secondi → 429 su tutto.
  // Con BATCH=3 e ZERO retry su 429, le richieste sono controllate.
  private readonly BATCH = 3;

  // Pausa tra le wave. Abbastanza lunga da non saturare il rate limit
  // della finestra breve di MyMemory (circa 1 req/sec per IP).
  private readonly DELAY_MS = 350;

  /**
   * Normalizza una stringa rimuovendo caratteri Unicode invisibili.
   */
  private normalizza(s: string): string {
    return s
      .replace(/[\u00A0\u202F\u2007\u2060]/g, ' ')
      .replace(/[\u200B-\u200F\u2028\u2029\uFEFF\u00AD]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private costruisciUrl(testo: string, lingua: string): string {
    let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(testo)}&langpair=it|${lingua}`;
    if (this.MYMEMORY_EMAIL && !this.MYMEMORY_EMAIL.startsWith('TUA_EMAIL')) {
      url += `&de=${encodeURIComponent(this.MYMEMORY_EMAIL)}`;
    }
    return url;
  }

  private attesa(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }

  /**
   * Esegue UNA singola fetch a mymemory — SENZA RETRY su 429.
   *
   * CORREZIONE CRITICA rispetto alla versione precedente:
   *   Prima: MAX_RETRIES=3 → su 429, aspettava 1s+3s+9s e riprovava.
   *   Con BATCH=8: ogni onda faceva 8×4=32 richieste → quota bruciata.
   *
   *   Ora: su 429 → { rateLimited: true } SUBITO, zero retry.
   *   Ragione: quando MyMemory risponde 429 significa che la quota
   *   giornaliera è esaurita. Ritentare NON serve: peggiora solo
   *   il problema consumando ulteriori tentativi inutili.
   */
  private async fetchSingolo(
    testoPerApi: string,
    lingua: string,
  ): Promise<{ tradotto?: string; rateLimited?: boolean; errore?: boolean; nop?: boolean }> {
    try {
      const resp = await fetch(this.costruisciUrl(testoPerApi, lingua));

      // 429 HTTP → quota esaurita → stop immediato, NESSUN retry
      if (resp.status === 429) {
        return { rateLimited: true };
      }

      if (!resp.ok) {
        return { errore: true };
      }

      const data = await resp.json();
      const statusBody = Number(data.responseStatus);

      // MyMemory a volte mette 429 nel body con HTTP 200
      if (statusBody === 429) {
        return { rateLimited: true };
      }

      if (statusBody !== 200) {
        return { errore: true };
      }

      const tradotto = data.responseData?.translatedText;
      if (tradotto && tradotto !== testoPerApi) {
        return { tradotto };
      }
      return { nop: true };
    } catch {
      return { errore: true };
    }
  }

  /**
   * Traduce le stringhe richieste in una determinata lingua.
   *
   * PARAMETRO onProgress (opzionale):
   *   Callback chiamato dopo ogni wave completata.
   *   Permette al componente di fare cdr.markForCheck() per aggiornare
   *   la UI in modo progressivo mentre la traduzione è ancora in corso.
   *
   * LOGICA STOP SU RATE LIMIT:
   *   Al primo 429 ricevuto da qualsiasi stringa della wave corrente,
   *   rateLimited=true e il loop si ferma SUBITO alla wave successiva.
   *   Le traduzioni già in cache restano disponibili.
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
    let rateLimited = false;

    if (mancanti.length === 0) {
      return { cache: cacheLingua, errori: 0, rateLimited: false };
    }

    for (let i = 0; i < mancanti.length; i += this.BATCH) {
      // Interrompi subito se la wave precedente ha ricevuto rate limit
      if (rateLimited) break;

      const batch = mancanti.slice(i, i + this.BATCH);

      // Esegui le richieste della wave in parallelo
      const risultati = await Promise.all(
        batch.map(async testoOriginale => {
          const testoPerApi = this.normalizza(testoOriginale);
          if (!testoPerApi) return { testoOriginale, esito: { nop: true as const } };
          const esito = await this.fetchSingolo(testoPerApi, lingua);
          return { testoOriginale, esito };
        }),
      );

      // Processa i risultati: aggiorna cache e controlla rate limit
      for (const { testoOriginale, esito } of risultati) {
        if (esito.tradotto) {
          cacheLingua.set(testoOriginale, esito.tradotto);
        } else if (esito.rateLimited) {
          // Primo 429 → fermiamo tutto il loop
          rateLimited = true;
        } else if (esito.errore) {
          errori++;
        }
      }

      // Aggiorna la UI con le traduzioni già disponibili (rendering progressivo)
      if (onProgress) {
        onProgress();
      }

      // Pausa tra le wave
      if (i + this.BATCH < mancanti.length && !rateLimited) {
        await this.attesa(this.DELAY_MS);
      }
    }

    return { cache: cacheLingua, errori, rateLimited };
  }

  getCached(lingua: string): Map<string, string> | undefined {
    return this.cache.get(lingua);
  }

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
