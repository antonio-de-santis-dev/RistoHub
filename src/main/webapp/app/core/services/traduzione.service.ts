import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TraduzioneService {
  private cache = new Map<string, Map<string, string>>();
  private readonly BATCH = 5;
  private readonly DELAY_MS = 120;

  /**
   * Traduce le stringhe richieste in una determinata lingua.
   * Se la cache contiene già alcune stringhe, traduce SOLO quelle mancanti
   * (cache incrementale) e le aggiunge alla cache esistente.
   */
  async traduci(testi: string[], lingua: string): Promise<{ cache: Map<string, string>; errori: number; rateLimited: boolean }> {
    // Prendi la cache esistente o creane una nuova
    let cacheLingua = this.cache.get(lingua);
    if (!cacheLingua) {
      cacheLingua = new Map<string, string>();
      this.cache.set(lingua, cacheLingua);
    }

    // Filtra e trova solo le stringhe MANCANTI dalla cache
    const tuttiValidi = testi.filter(s => s && s.trim().length > 0);
    const mancanti = Array.from(new Set(tuttiValidi.filter(s => !cacheLingua!.has(s))));

    let errori = 0;
    let rateLimited = false;

    if (mancanti.length === 0) {
      // Tutto già tradotto in cache
      return { cache: cacheLingua, errori: 0, rateLimited: false };
    }

    for (let i = 0; i < mancanti.length; i += this.BATCH) {
      const batch = mancanti.slice(i, i + this.BATCH);
      await Promise.all(
        batch.map(async testo => {
          try {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(testo)}&langpair=it|${lingua}`;
            const resp = await fetch(url);
            if (!resp.ok) {
              errori++;
              return;
            }
            const data = await resp.json();
            if (Number(data.responseStatus) === 429) {
              rateLimited = true;
              return;
            }
            const tradotto = data.responseData?.translatedText;
            if (tradotto && tradotto !== testo && Number(data.responseStatus) === 200) {
              cacheLingua!.set(testo, tradotto);
            }
          } catch {
            errori++;
          }
        }),
      );
      if (i + this.BATCH < mancanti.length) await new Promise(res => setTimeout(res, this.DELAY_MS));
    }

    return { cache: cacheLingua, errori, rateLimited };
  }

  /**
   * Ritorna la mappa di traduzione per una lingua.
   * NOTA: con la cache incrementale questa mappa può essere parziale.
   */
  getCached(lingua: string): Map<string, string> | undefined {
    return this.cache.get(lingua);
  }

  /**
   * Verifica se TUTTE le stringhe richieste sono già in cache per quella lingua.
   * Usato dai componenti per decidere se serve chiamare traduci().
   */
  hasAllCached(testi: string[], lingua: string): boolean {
    const cacheLingua = this.cache.get(lingua);
    if (!cacheLingua) return false;
    for (const t of testi) {
      if (t && t.trim().length > 0 && !cacheLingua.has(t)) return false;
    }
    return true;
  }

  /**
   * DEPRECATED: mantenuto per compatibilità. Usare hasAllCached() per verifiche granulari.
   * Ritorna true solo se esiste una cache non vuota per la lingua.
   */
  hasCached(lingua: string): boolean {
    const c = this.cache.get(lingua);
    return !!c && c.size > 0;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
