import { Component } from '@angular/core';
import { Wordmark } from '../wordmark/wordmark';
import { BRAND } from '../../data/content';

/** Full site footer used on the landing page. */
@Component({
  selector: 'wg-site-footer',
  standalone: true,
  imports: [Wordmark],
  template: `
    <div class="wrap">
      <div class="foot-inner">
        <div>
          <wg-wordmark />
          <p class="foot-tag">{{ brand.tagline }}</p>
        </div>
        <nav class="foot-links" aria-label="Footer">
          <a href="#join" (click)="scrollToJoin($event)">Join waitlist</a>
          <a href="#" rel="nofollow">Privacy</a>
          <a [href]="'mailto:' + brand.contactEmail">Contact</a>
        </nav>
      </div>
      <p class="foot-legal">© <span>{{ year }}</span> {{ brand.name }}. {{ brand.legal }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 60px 0 48px; border-top: 1px solid var(--ink-12); }
    .foot-inner { display: flex; justify-content: space-between; gap: 30px; flex-wrap: wrap; align-items: flex-start; }
    .foot-tag { font-family: var(--serif); font-style: italic; font-size: 18px; color: var(--ink-70); max-width: 30ch; margin: 14px 0 0; }
    .foot-links { display: flex; gap: 26px; font-size: 14.5px; font-family: var(--mono); letter-spacing: .02em; }
    .foot-links a { text-decoration: none; color: var(--ink-70); }
    .foot-links a:hover { color: var(--rust-ink); }
    .foot-legal { margin-top: 40px; font-family: var(--mono); font-size: 12px; color: var(--ink-40); letter-spacing: .03em; }
  `],
})
export class SiteFooter {
  readonly brand = BRAND;
  readonly year = new Date().getFullYear();

  scrollToJoin(event: Event): void {
    event.preventDefault();
    const el = document.getElementById('join');
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
}
