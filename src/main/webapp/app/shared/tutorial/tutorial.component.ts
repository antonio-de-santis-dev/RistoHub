import { Component, OnDestroy, inject, signal, effect, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorialService } from './tutorial.service';

@Component({
  selector: 'rh-tutorial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss'],
})
export class TutorialComponent implements OnDestroy {
  private readonly tutorialService = inject(TutorialService);
  private readonly ngZone = inject(NgZone);

  phase = this.tutorialService.phase;
  currentSlide = this.tutorialService.currentSlide;
  currentSpotlight = this.tutorialService.currentSpotlight;
  slides = this.tutorialService.slides;
  spotlightSteps = this.tutorialService.spotlightSteps;

  private clickListener: ((e: Event) => void) | null = null;
  private currentHighlighted: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const idx = this.currentSpotlight();
      const ph = this.phase();

      this.clearHighlight();

      if (ph !== 'spotlight') {
        this.removeClickListener();
        return;
      }

      const step = this.spotlightSteps[idx];

      if (step.openSidebar) {
        const hamburger = document.querySelector('.rh-hamburger') as HTMLElement;
        if (hamburger && !document.querySelector('.rh-drawer.open')) {
          hamburger.click();
        }
      }

      setTimeout(() => this.setupStep(idx), 200);
    });
  }

  private setupStep(idx: number): void {
    const step = this.spotlightSteps[idx];
    const el = document.querySelector(step.targetSelector) as HTMLElement | null;

    if (el) {
      // Porta l'elemento SOPRA l'overlay aggiungendo la classe highlight
      el.classList.add('rh-tut-highlight');
      this.currentHighlighted = el;
    }

    if (step.advanceMode === 'click' && el) {
      this.removeClickListener();
      this.clickListener = () => {
        this.removeClickListener();
        setTimeout(() => {
          this.ngZone.run(() => this.tutorialService.nextSpotlight());
        }, 350);
      };
      el.addEventListener('click', this.clickListener, { once: true });
    }
  }

  private clearHighlight(): void {
    // Rimuove da elemento corrente
    this.currentHighlighted?.classList.remove('rh-tut-highlight');
    this.currentHighlighted = null;
    // Pulizia totale per sicurezza
    document.querySelectorAll('.rh-tut-highlight').forEach(el => el.classList.remove('rh-tut-highlight'));
  }

  private removeClickListener(): void {
    if (this.clickListener) {
      this.spotlightSteps.forEach(s => {
        document.querySelector(s.targetSelector)?.removeEventListener('click', this.clickListener!);
      });
      this.clickListener = null;
    }
  }

  ngOnDestroy(): void {
    this.removeClickListener();
    this.clearHighlight();
  }

  start(): void {
    this.tutorialService.startTutorial();
  }
  skip(): void {
    this.clearHighlight();
    this.tutorialService.skipTutorial();
  }
  next(): void {
    this.tutorialService.nextSlide();
  }
  prev(): void {
    this.tutorialService.prevSlide();
  }
  nextSpot(): void {
    this.tutorialService.nextSpotlight();
  }

  get isLastSpot(): boolean {
    return this.currentSpotlight() === this.spotlightSteps.length - 1;
  }
  get isClickStep(): boolean {
    return this.spotlightSteps[this.currentSpotlight()]?.advanceMode === 'click';
  }
  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('rh-tutorial-overlay')) {
      this.skip();
    }
  }
}
