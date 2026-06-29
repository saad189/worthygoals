import { Component, Input } from '@angular/core';
import { Wordmark } from '../wordmark/wordmark';
import { RevealDirective } from '../../shared/reveal.directive';
import { BRAND } from '../../data/content';

/**
 * Minimal on-brand layout for standalone content pages (Privacy, Contact):
 * wordmark bar → eyebrow + heading + projected content → sticky footer.
 */
@Component({
  selector: 'wg-page-shell',
  standalone: true,
  imports: [Wordmark, RevealDirective],
  template: `
    <header class="bar">
      <div class="wrap"><wg-wordmark link="/" /></div>
    </header>

    <main>
      <div class="wrap">
        @if (eyebrow) { <p class="eyebrow" appReveal>{{ eyebrow }}</p> }
        <h1 appReveal>{{ heading }}</h1>
        <div class="content" appReveal>
          <ng-content />
        </div>
      </div>
    </main>

    <footer>
      <div class="wrap foot-inner">
        <span class="foot-tag">{{ brand.tagline }}</span>
        <span class="foot-legal">© <span>{{ year }}</span> {{ brand.name }}</span>
      </div>
    </footer>
  `,
  styles: [`
    :host { --maxw: 760px; display: flex; flex-direction: column; min-height: 100svh; }

    .bar { padding-top: clamp(22px, 4vw, 34px); }
    main { flex: 1 0 auto; padding-top: clamp(40px, 8vw, 76px); padding-bottom: clamp(48px, 8vw, 80px); }
    h1 { font-size: clamp(34px, 6.4vw, 58px); line-height: 1.06; }
    .content { margin-top: 26px; color: var(--ink-70); font-size: clamp(17px, 2vw, 20px); max-width: 60ch; }

    footer { flex-shrink: 0; border-top: 1px solid var(--ink-12); padding: 30px 0 38px; }
    .foot-inner { display: flex; flex-wrap: wrap; gap: 14px 26px; align-items: baseline; justify-content: space-between; }
    .foot-tag { font-family: var(--serif); font-style: italic; color: var(--ink-70); font-size: 16px; }
    .foot-legal { font-family: var(--mono); font-size: 12px; color: var(--ink-40); letter-spacing: .03em; }
  `],
})
export class PageShell {
  @Input() eyebrow = '';
  @Input({ required: true }) heading = '';
  readonly brand = BRAND;
  readonly year = new Date().getFullYear();
}
