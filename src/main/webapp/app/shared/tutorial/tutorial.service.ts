import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type TutorialPhase = 'hidden' | 'welcome' | 'slides' | 'spotlight';

export interface SpotlightStep {
  targetSelector: string;
  title: string;
  description: string;
  // 'click' = l'utente deve cliccare l'elemento per avanzare (nessun pulsante Avanti)
  // 'button' = avanza con il pulsante Avanti
  advanceMode: 'click' | 'button';
  openSidebar?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TutorialService {
  private readonly http = inject(HttpClient);

  phase = signal<TutorialPhase>('hidden');
  currentSlide = signal(0);
  currentSpotlight = signal(0);

  readonly slides = [
    {
      icon: '🏠',
      title: 'Dashboard',
      description: "La tua Home è il centro di controllo. Qui trovi in un colpo d'occhio tutti i tuoi menu attivi e i piatti del giorno.",
    },
    {
      icon: '📋',
      title: 'Creazione Menu',
      description:
        'Con il wizard "Crea Menu" puoi costruire il tuo menu in pochi passaggi: nome, copertina, portate e prodotti. Puoi creare quanti menu vuoi e attivarli in qualsiasi momento.',
    },
    {
      icon: '🍝',
      title: 'Prodotti e Portate',
      description:
        'Ogni menu è composto da portate (es. "Primi Piatti") e ogni portata contiene i prodotti con nome, prezzo, allergeni e foto.',
    },
    {
      icon: '⭐',
      title: 'Piatti del Giorno',
      description:
        'Le proposte speciali che cambiano quotidianamente. Attivali/disattivali con un click — appariranno in evidenza nel menu pubblico.',
    },
    {
      icon: '📱',
      title: 'Contatti e QR Code',
      description: 'Aggiungi i tuoi recapiti sotto il menu pubblico e genera il QR Code da stampare sui tavoli del tuo locale!',
    },
  ];

  readonly spotlightSteps: SpotlightStep[] = [
    {
      targetSelector: '.rh-hamburger',
      title: 'Apri il menu di navigazione',
      description: "Clicca questo pulsante per aprire il menu laterale e scoprire tutte le sezioni dell'app.",
      advanceMode: 'click',
    },
    {
      targetSelector: 'a[routerLink="/home"]',
      title: 'Home — Dashboard',
      description: 'Torna sempre alla dashboard con il riepilogo dei tuoi menu e piatti del giorno.',
      advanceMode: 'button',
      openSidebar: true,
    },
    {
      targetSelector: 'a[routerLink="/menu-wizard"]',
      title: 'Crea Menu',
      description: 'Crea un nuovo menu digitale passo-passo con il nostro wizard guidato.',
      advanceMode: 'button',
    },
    {
      targetSelector: 'a[routerLink="/piatti-giorno"]',
      title: 'Piatti del Giorno',
      description: 'Gestisci i piatti speciali del giorno: aggiungili, attivali e disattivali in un click.',
      advanceMode: 'button',
    },
    {
      targetSelector: 'a[routerLink="/contatti"]',
      title: 'Contatti',
      description: 'Aggiungi telefono, indirizzo e social che appariranno sotto il tuo menu pubblico.',
      advanceMode: 'button',
    },
    {
      targetSelector: 'a[routerLink="/menu-list"]',
      title: 'I miei Menu',
      description: 'Qui trovi tutti i tuoi menu. Puoi aprirli, modificarli o generare il QR code.',
      advanceMode: 'button',
    },
    {
      targetSelector: '[data-tutorial="tutorial-btn"]',
      title: 'Rivedi il tutorial',
      description: 'Puoi rivedere questo tutorial in qualsiasi momento da qui. Hai finito — buon lavoro! 🎉',
      advanceMode: 'button',
    },
  ];

  checkAndShow(tutorialCompleted: boolean): void {
    if (!tutorialCompleted) {
      this.phase.set('welcome');
    }
  }

  startTutorial(): void {
    this.currentSlide.set(0);
    this.phase.set('slides');
  }

  skipTutorial(): void {
    this.phase.set('hidden');
    this.markCompleted();
  }

  nextSlide(): void {
    const next = this.currentSlide() + 1;
    if (next >= this.slides.length) {
      this.currentSpotlight.set(0);
      this.phase.set('spotlight');
    } else {
      this.currentSlide.set(next);
    }
  }

  prevSlide(): void {
    const prev = this.currentSlide() - 1;
    if (prev >= 0) this.currentSlide.set(prev);
  }

  nextSpotlight(): void {
    const next = this.currentSpotlight() + 1;
    if (next >= this.spotlightSteps.length) {
      this.completeTutorial();
    } else {
      this.currentSpotlight.set(next);
    }
  }

  completeTutorial(): void {
    this.phase.set('hidden');
    this.markCompleted();
  }

  relaunch(): void {
    this.currentSlide.set(0);
    this.phase.set('welcome');
  }

  private markCompleted(): void {
    this.http.post('/api/account/tutorial-completed', {}).subscribe();
  }
}
