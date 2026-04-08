import { Component, OnDestroy, inject, signal, effect, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorialService } from './tutorial.service';

interface SpotlightRect {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}

const DRAWER_ANIM_MS = 380; // animazione drawer 0.32s + margine
const PADDING = 10;

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

  spotRect = signal<SpotlightRect | null>(null);
  vw = signal(window.innerWidth);
  vh = signal(window.innerHeight);

  private currentHighlighted: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private setupTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const idx = this.currentSpotlight();
      const ph = this.phase();

      this.cleanup();

      if (ph !== 'spotlight') return;

      const step = this.spotlightSteps[idx];

      if (step.advanceMode === 'click') {
        // Step CLICK (es. hamburger):
        // 1. Evidenzia l'elemento con il buco SVG
        // 2. Il buco è trasparente ai click → l'utente clicca l'elemento reale
        // 3. MutationObserver rileva quando il drawer riceve la classe "open"
        // 4. Dopo l'animazione avanza automaticamente al passo successivo
        this.setupClickStep(idx);
        return;
      }

      if (step.openSidebar) {
        // Step BUTTON che richiede il drawer aperto:
        // aprilo programmaticamente se non lo è già
        const isOpen = !!document.querySelector('.rh-drawer.open');
        if (!isOpen) {
          const hamburger = document.querySelector('.rh-hamburger') as HTMLElement | null;
          hamburger?.click();
          this.setupTimer = setTimeout(() => {
            this.setupTimer = null;
            this.ngZone.run(() => this.setupButtonStep(idx));
          }, DRAWER_ANIM_MS);
          return;
        }
      }

      this.setupTimer = setTimeout(() => {
        this.setupTimer = null;
        this.ngZone.run(() => this.setupButtonStep(idx));
      }, 60);
    });
  }

  private setupClickStep(idx: number): void {
    const step = this.spotlightSteps[idx];
    const el = document.querySelector(step.targetSelector) as HTMLElement | null;

    if (el) {
      this.currentHighlighted = el;
      this.updateSpotRect(el);
      this.startResize(el);
    }

    // Osserva il drawer per sapere quando l'utente lo ha aperto
    const drawer = document.querySelector('.rh-drawer');
    if (drawer) {
      this.mutationObserver = new MutationObserver(() => {
        if (drawer.classList.contains('open')) {
          this.stopMutation();
          // Aspetta la fine dell'animazione poi avanza
          this.setupTimer = setTimeout(() => {
            this.setupTimer = null;
            this.ngZone.run(() => this.tutorialService.nextSpotlight());
          }, DRAWER_ANIM_MS);
        }
      });
      this.mutationObserver.observe(drawer, { attributes: true, attributeFilter: ['class'] });
    }
  }

  private setupButtonStep(idx: number): void {
    const step = this.spotlightSteps[idx];
    const el = document.querySelector(step.targetSelector) as HTMLElement | null;

    if (el) {
      this.currentHighlighted = el;
      this.updateSpotRect(el);
      this.startResize(el);
    } else {
      this.spotRect.set(null);
    }
  }

  private updateSpotRect(el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      this.spotRect.set(null);
      return;
    }
    const p = PADDING;
    this.vw.set(window.innerWidth);
    this.vh.set(window.innerHeight);
    this.spotRect.set({
      x: rect.left - p,
      y: rect.top - p,
      w: rect.width + p * 2,
      h: rect.height + p * 2,
      r: 10,
    });
  }

  private startResize(el: HTMLElement): void {
    this.stopResize();
    this.resizeObserver = new ResizeObserver(() => {
      if (this.currentHighlighted) {
        this.ngZone.run(() => this.updateSpotRect(this.currentHighlighted!));
      }
    });
    this.resizeObserver.observe(document.body);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onResize, { passive: true });
  }

  private stopResize(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onResize);
  }

  private stopMutation(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
  }

  private readonly onResize = (): void => {
    if (this.currentHighlighted) {
      this.ngZone.run(() => this.updateSpotRect(this.currentHighlighted!));
    }
  };

  private cleanup(): void {
    if (this.setupTimer !== null) {
      clearTimeout(this.setupTimer);
      this.setupTimer = null;
    }
    this.stopResize();
    this.stopMutation();
    this.currentHighlighted = null;
    this.spotRect.set(null);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  start(): void {
    this.tutorialService.startTutorial();
  }
  skip(): void {
    this.cleanup();
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

  buildClipPath(r: SpotlightRect): string {
    const { x, y, w, h, r: rx } = r;
    return [
      `M0 0 H${this.vw()} V${this.vh()} H0 Z`,
      `M${x + rx} ${y}`,
      `H${x + w - rx}`,
      `Q${x + w} ${y} ${x + w} ${y + rx}`,
      `V${y + h - rx}`,
      `Q${x + w} ${y + h} ${x + w - rx} ${y + h}`,
      `H${x + rx}`,
      `Q${x} ${y + h} ${x} ${y + h - rx}`,
      `V${y + rx}`,
      `Q${x} ${y} ${x + rx} ${y}`,
      `Z`,
    ].join(' ');
  }
}
