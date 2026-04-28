import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TraduzioneService {
  // La cache è indicizzata per testo ORIGINALE (così i componenti possono
  // fare getCached(lingua).get(prod.nome) senza dover normalizzare lato loro).
  // La chiamata all'API viene invece fatta con testo NORMALIZZATO.
  private cache = new Map<string, Map<string, string>>();

  // ── Configurazione rate limit ──────────────────────────────────────────────
  //
  // mymemory.translated.net gratis:
  //   • senza email: ~1000 parole/giorno per IP + finestra breve stretta
  //   • con email (param `de`): ~50.000 parole/giorno
  //
  // L'email viene passata in URL — è VISIBILE a chiunque apra DevTools perché
  // il codice Angular finisce nel bundle client. Non mettere email private:
  // usa un indirizzo dedicato (es. traduzioni@tuodominio.it).
  //
  // ⚠️  SOSTITUISCI questa stringa con la tua email prima del deploy.
  //     Se la lasci invariata il servizio funziona comunque ma con rate limit basso.
  private readonly MYMEMORY_EMAIL = 'boardroom.progetto@gmail.com';

  // ── Parametri di throttling ────────────────────────────────────────────────
  //
  // OTTIMIZZAZIONE PERFORMANCE (rispetto alla versione precedente):
  //   BATCH:    3 → 8   (+167% richieste parallele per wave)
  //   DELAY_MS: 400 → 200ms (-50% attesa tra le wave)
  //
  // Effetto su 177 prodotti × 2 stringhe = ~354 stringhe:
  //   Prima:  354/3 = 118 wave × 400ms = ~47 secondi di delay puro
  //   Dopo:   354/8 = 45 wave  × 200ms = ~9 secondi di delay puro
  //
  // Il parametro onProgress nel metodo traduci() permette al componente
  // di aggiornare la UI dopo ogni wave (rendering progressivo prodotto per prodotto).
  private readonly BATCH = 8; // richieste parallele per wave (era 3)
  private readonly DELAY_MS = 200; // pausa tra le wave in ms (era 400)
  private readonly MAX_RETRIES = 3; // tentativi su 429 per singola richiesta
  private readonly RETRY_BASE_MS = 1000; // backoff esponenziale: 1s, 3s, 9s

  /**
   * Normalizza una stringa rimuovendo caratteri Unicode invisibili che:
   *   • rompono le API di traduzione (mymemory) — che restituiscono il testo
   *     identico all'input quando non riescono a processarlo, facendo fallire
   *     il check `tradotto !== testo` e lasciando la cache vuota
   *   • creano stringhe "doppie" visivamente identiche ma diverse tecnicamente
   *
   * Caratteri gestiti: NBSP, narrow NBSP, figure space, word joiner,
   * zero-width space, LRM/RLM, line/paragraph separator, BOM, soft hyphen.
   *
   * Questa normalizzazione è una rete di sicurezza lato client: i dati dovrebbero
   * arrivare già puliti dal backend (vedi PdfImportService.pulisciTesto), ma qui
   * copriamo anche i prodotti importati PRIMA del fix backend.
   */
  private normalizza(s: string): string {
    return s
      .replace(/[\u00A0\u202F\u2007\u2060]/g, ' ') // vari tipi di NBSP/figure space → spazio normale
      .replace(/[\u200B-\u200F\u2028\u2029\uFEFF\u00AD]/g, '') // zero-width, LRM/RLM, separators, BOM, soft hyphen
      .replace(/\s+/g, ' ') // collassa whitespace multipli
      .trim();
  }

  /**
   * Costruisce la URL di mymemory con l'email opzionale per alzare il rate limit.
   */
  private costruisciUrl(testo: string, lingua: string): string {
    let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(testo)}&langpair=it|${lingua}`;
    // Aggiungiamo `de` solo se l'email è stata davvero configurata
    // (evita di mandare letteralmente "TUA_EMAIL@dominio.it" all'API).
    if (this.MYMEMORY_EMAIL && !this.MYMEMORY_EMAIL.startsWith('TUA_EMAIL')) {
      url += `&de=${encodeURIComponent(this.MYMEMORY_EMAIL)}`;
    }
    return url;
  }

  private attesa(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms));
  }

  /**
   * Esegue una singola fetch a mymemory con retry esponenziale sui 429.
   *
   * Ritorna uno di questi esiti:
   *   { tradotto }    → successo, salvare in cache
   *   { rateLimited } → dopo tutti i retry è ancora 429: il chiamante
   *                     deve fermare la traduzione
   *   { errore }      → errore HTTP o di rete, retry esauriti
   *   { nop }         → risposta valida ma traduzione identica/vuota
   */
  private async fetchConRetry(
    testoPerApi: string,
    lingua: string,
  ): Promise<{ tradotto?: string; rateLimited?: boolean; errore?: boolean; nop?: boolean }> {
    for (let tentativo = 0; tentativo <= this.MAX_RETRIES; tentativo++) {
      try {
        const resp = await fetch(this.costruisciUrl(testoPerApi, lingua));

        // 429 a livello HTTP
        if (resp.status === 429) {
          if (tentativo < this.MAX_RETRIES) {
            await this.attesa(this.RETRY_BASE_MS * Math.pow(3, tentativo));
            continue;
          }
          return { rateLimited: true };
        }

        if (!resp.ok) {
          return { errore: true };
        }

        const data = await resp.json();
        const statusBody = Number(data.responseStatus);

        // mymemory spesso mette 429 nel body con status HTTP 200
        if (statusBody === 429) {
          if (tentativo < this.MAX_RETRIES) {
            await this.attesa(this.RETRY_BASE_MS * Math.pow(3, tentativo));
            continue;
          }
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
        // Errore di rete: retry con backoff
        if (tentativo < this.MAX_RETRIES) {
          await this.attesa(this.RETRY_BASE_MS * Math.pow(3, tentativo));
          continue;
        }
        return { errore: true };
      }
    }
    return { errore: true };
  }

  /**
   * Traduce le stringhe richieste in una determinata lingua.
   * Se la cache contiene già alcune stringhe, traduce SOLO quelle mancanti
   * (cache incrementale) e le aggiunge alla cache esistente.
   *
   * Chiave di cache: il testo ORIGINALE (non normalizzato), così che i
   * componenti possano fare lookup diretto con prod.nome/prod.descrizione
   * senza doversi preoccupare della normalizzazione.
   *
   * PARAMETRO onProgress (NUOVO):
   *   Callback opzionale chiamato dopo ogni wave completata.
   *   Permette al componente di chiamare cdr.markForCheck() e aggiornare
   *   la UI in modo PROGRESSIVO mentre la traduzione è ancora in corso,
   *   invece di aspettare che tutte le stringhe siano tradotte.
   *   Effetto visivo: i prodotti appaiono tradotti uno a uno man mano
   *   che i batch vengono completati (come un aggiornamento progressivo).
   *
   * Se durante l'esecuzione riceviamo 429 anche dopo i retry, interrompiamo
   * il loop: inutile sparare altre richieste destinate a fallire. Le
   * traduzioni già ottenute restano in cache e verranno riutilizzate al
   * prossimo cambio lingua.
   *
   * @param testi    array di stringhe da tradurre
   * @param lingua   codice lingua target (es. 'en', 'fr', 'de', 'es')
   * @param onProgress  callback opzionale chiamato dopo ogni wave → usare per cdr.markForCheck()
   */
  async traduci(
    testi: string[],
    lingua: string,
    onProgress?: () => void,
  ): Promise<{ cache: Map<string, string>; errori: number; rateLimited: boolean }> {
    // Prendi la cache esistente o creane una nuova
    let cacheLingua = this.cache.get(lingua);
    if (!cacheLingua) {
      cacheLingua = new Map<string, string>();
      this.cache.set(lingua, cacheLingua);
    }

    // Filtra e trova solo le stringhe MANCANTI dalla cache.
    // Usiamo il testo originale come chiave.
    const tuttiValidi = testi.filter(s => s && s.trim().length > 0);
    const mancanti = Array.from(new Set(tuttiValidi.filter(s => !cacheLingua!.has(s))));

    let errori = 0;
    let rateLimited = false;

    if (mancanti.length === 0) {
      // Tutto già tradotto in cache
      return { cache: cacheLingua, errori: 0, rateLimited: false };
    }

    for (let i = 0; i < mancanti.length; i += this.BATCH) {
      // Se abbiamo già sbattuto contro il rate limit in un batch precedente,
      // inutile continuare a sparare richieste: interrompiamo e segnaliamo.
      if (rateLimited) break;

      const batch = mancanti.slice(i, i + this.BATCH);
      await Promise.all(
        batch.map(async testoOriginale => {
          // Normalizziamo PRIMA di inviare a mymemory. Il testo normalizzato
          // è quello che l'API riceve; manteniamo testoOriginale come chiave
          // di cache per allineare con quanto fa il componente in getT().
          const testoPerApi = this.normalizza(testoOriginale);
          if (!testoPerApi) return; // stringa vuota dopo normalizzazione

          const esito = await this.fetchConRetry(testoPerApi, lingua);

          if (esito.tradotto) {
            // Salviamo con chiave ORIGINALE così getCached().get(prod.nome) funziona
            cacheLingua!.set(testoOriginale, esito.tradotto);
          } else if (esito.rateLimited) {
            rateLimited = true;
          } else if (esito.errore) {
            errori++;
          }
          // esito.nop → traduzione identica, non salviamo niente né contiamo errore
        }),
      );

      // ── RENDERING PROGRESSIVO ─────────────────────────────────────────────
      // Dopo ogni wave completata, notifichiamo il componente così può
      // aggiornare la UI con le traduzioni già disponibili in cache,
      // senza aspettare che tutte le stringhe siano tradotte.
      // Il componente chiama cdr.markForCheck() → Angular ri-renderizza
      // solo i prodotti già tradotti, lasciando gli altri con il testo originale.
      if (onProgress) {
        onProgress();
      }

      if (i + this.BATCH < mancanti.length && !rateLimited) {
        await this.attesa(this.DELAY_MS);
      }
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
