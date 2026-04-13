import { trigger, transition, style, animate, query, group } from '@angular/animations';

/**
 * Animazioni di transizione tra route.
 *
 * landing → login  : la landing scala e sfuma, il login entra da destra
 * login   → *      : fade semplice in uscita
 * *       → *      : fade leggero di default
 */
export const routeAnimations = trigger('routeAnimations', [
  // ── landing → login ─────────────────────────────────────────────
  transition('landing => login', [
    style({ position: 'relative', overflow: 'hidden' }),
    query(':enter, :leave', [style({ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' })], { optional: true }),

    // Stato iniziale: entrata parte da destra
    query(':enter', [style({ transform: 'translateX(100%)', opacity: 0 })], { optional: true }),

    group([
      // Uscita: landing scala verso il centro e sfuma
      query(':leave', [animate('480ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'scale(0.92)', opacity: 0 }))], { optional: true }),

      // Entrata: login scorre da destra con leggero delay
      query(':enter', [animate('480ms 80ms cubic-bezier(0.22, 0.61, 0.36, 1)', style({ transform: 'translateX(0)', opacity: 1 }))], {
        optional: true,
      }),
    ]),
  ]),

  // ── login → landing (back) ───────────────────────────────────────
  transition('login => landing', [
    style({ position: 'relative', overflow: 'hidden' }),
    query(':enter, :leave', [style({ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' })], { optional: true }),

    query(':enter', [style({ transform: 'scale(0.92)', opacity: 0 })], { optional: true }),

    group([
      query(':leave', [animate('400ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'translateX(100%)', opacity: 0 }))], {
        optional: true,
      }),

      query(':enter', [animate('480ms 60ms cubic-bezier(0.22, 0.61, 0.36, 1)', style({ transform: 'scale(1)', opacity: 1 }))], {
        optional: true,
      }),
    ]),
  ]),

  // ── default: solo entering fa fade-in — :leave rimane in flow ─────
  // RIMOSSA la position:absolute su :leave che collassava il container
  // a 0px di altezza causando il salto del footer durante le transizioni.
  transition('* <=> *', [query(':enter', [style({ opacity: 0 }), animate('180ms ease', style({ opacity: 1 }))], { optional: true })]),
]);
