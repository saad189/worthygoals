import { Component, HostBinding, HostListener } from '@angular/core';
import { Wordmark } from '../wordmark/wordmark';
import { CTA } from '../../data/content';

/** Sticky top navigation. Gains a hairline border once the page scrolls. */
@Component({
  selector: 'wg-nav-bar',
  standalone: true,
  imports: [Wordmark],
  template: `
    <div class="wrap nav-inner">
      <wg-wordmark [animate]="true" />
      <a href="#join" class="btn btn-primary" (click)="scrollToJoin($event)">{{ cta.buttonLabel }}</a>
    </div>
  `,
  styles: [`
    :host {
      position: sticky;
      top: 0;
      z-index: 50;
      display: block;
      background: rgba(244, 239, 227, 0.82);
      backdrop-filter: saturate(140%) blur(10px);
      -webkit-backdrop-filter: saturate(140%) blur(10px);
      border-bottom: 1px solid transparent;
      transition: border-color .3s ease, background .3s ease;
    }
    :host(.scrolled) { border-bottom-color: var(--ink-12); }
    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 68px;
    }
    .btn { font-size: 14px; padding: 9px 16px; }
  `],
})
export class NavBar {
  readonly cta = CTA;

  @HostBinding('class.scrolled') scrolled = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 8;
  }

  scrollToJoin(event: Event): void {
    event.preventDefault();
    const el = document.getElementById('join');
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
}
