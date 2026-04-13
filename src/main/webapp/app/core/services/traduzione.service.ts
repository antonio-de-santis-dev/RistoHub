import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TraduzioneService {
  private cache = new Map<string, Map<string, string>>();
  private readonly BATCH = 5;
  private readonly DELAY_MS = 120;

  async traduci(testi: string[], lingua: string): Promise<{ cache: Map<string, string>; errori: number; rateLimited: boolean }> {
    if (this.cache.has(lingua)) {
      return { cache: this.cache.get(lingua)!, errori: 0, rateLimited: false };
    }
    const nuovaCache = new Map<string, string>();
    const lista = testi.filter(s => s.trim().length > 0);
    let errori = 0;
    let rateLimited = false;

    for (let i = 0; i < lista.length; i += this.BATCH) {
      const batch = lista.slice(i, i + this.BATCH);
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
              nuovaCache.set(testo, tradotto);
            }
          } catch {
            errori++;
          }
        }),
      );
      if (i + this.BATCH < lista.length) await new Promise(res => setTimeout(res, this.DELAY_MS));
    }
    this.cache.set(lingua, nuovaCache);
    return { cache: nuovaCache, errori, rateLimited };
  }

  getCached(lingua: string): Map<string, string> | undefined {
    return this.cache.get(lingua);
  }

  hasCached(lingua: string): boolean {
    return this.cache.has(lingua);
  }

  clearCache(): void {
    this.cache.clear();
  }
}
