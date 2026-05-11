import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProdottoDTO, TraduzioniProdotto } from '../shared/model/risto.model';

@Injectable({
  providedIn: 'root',
})
export class TraduzioneService {
  private apiUrl = 'http://localhost:5000'; // URL di LibreTranslate

  constructor(private http: HttpClient) {}

  /**
   * Traduce un testo usando LibreTranslate
   */
  traduceTesto(testo: string, linguaTarget: string, linguaSource: string = 'it'): Observable<string> {
    if (!testo) return of('');

    const body = {
      q: testo,
      source: linguaSource,
      target: linguaTarget,
    };

    return this.http.post<{ translatedText: string }>(`${this.apiUrl}/translate`, body).pipe(
      catchError(error => {
        console.error('Errore nella traduzione:', error);
        return of(testo); // Ritorna il testo originale in caso di errore
      }),
    );
  }

  /**
   * Traduce un prodotto (nome e descrizione)
   */
  traduceProdotto(prodotto: ProdottoDTO, linguaTarget: string): Observable<ProdottoDTO> {
    if (!prodotto) return of(prodotto);

    const traduzioni$ = [this.traduceTesto(prodotto.nome ?? '', linguaTarget), this.traduceTesto(prodotto.descrizione ?? '', linguaTarget)];

    return new Observable<ProdottoDTO>(observer => {
      Promise.all(traduzioni$)
        .then(([nomeTradotto, descrizioneTradotta]) => {
          const prodottoTradotto: ProdottoDTO = {
            ...prodotto,
            nome: nomeTradotto,
            descrizione: descrizioneTradotta,
            traduzioni: {
              ...prodotto.traduzioni,
              [linguaTarget]: {
                nome: nomeTradotto,
                descrizione: descrizioneTradotta,
              },
            },
          };
          observer.next(prodottoTradotto);
          observer.complete();
        })
        .catch(error => {
          console.error('Errore nella traduzione del prodotto:', error);
          observer.next(prodotto);
          observer.complete();
        });
    });
  }

  /**
   * Ottiene la traduzione di un prodotto per una lingua specifica
   */
  getTraduzioneProdotto(prodotto: ProdottoDTO, lingua: string): TraduzioniProdotto | undefined {
    if (!prodotto.traduzioni) return undefined;
    return prodotto.traduzioni[lingua];
  }

  /**
   * Traduce una lista di prodotti
   */
  traduceListaProdotti(prodotti: ProdottoDTO[], linguaTarget: string): Observable<ProdottoDTO[]> {
    if (!prodotti || prodotti.length === 0) return of(prodotti);

    const traduzioni = prodotti.map(prodotto => this.traduceProdotto(prodotto, linguaTarget));

    return new Observable<ProdottoDTO[]>(observer => {
      Promise.all(traduzioni)
        .then(prodottiTradotti => {
          observer.next(prodottiTradotti);
          observer.complete();
        })
        .catch(error => {
          console.error('Errore nella traduzione della lista prodotti:', error);
          observer.next(prodotti);
          observer.complete();
        });
    });
  }
}
