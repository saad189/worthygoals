import { Component, Input } from '@angular/core';
import { Benefit } from '../../data/content';

/** A launch-benefit row with a line icon, title, and description. */
@Component({
  selector: 'wg-benefit-card',
  standalone: true,
  template: `
    <div class="ben">
      <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
        @switch (benefit.icon) {
          @case ('roster') {
            <circle cx="9" cy="8" r="3.2"></circle>
            <path d="M3.5 19c0-3 2.4-5 5.5-5s5.5 2 5.5 5"></path>
            <circle cx="17.5" cy="9.5" r="2.4"></circle>
            <path d="M15 19c.2-2.4 1.7-4 4-4 1.2 0 2.2.5 3 1.3"></path>
          }
          @case ('message') {
            <path d="M5 4h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4 4V5a1 1 0 0 1 1-1z"></path>
            <path d="M8.5 9.5h7M8.5 12.5h4"></path>
          }
          @case ('board') {
            <rect x="3.5" y="4.5" width="17" height="13" rx="1.5"></rect>
            <path d="M7 14l3-3 2.2 2.2L17 8"></path>
            <path d="M9 20.5h6"></path>
          }
          @case ('psych') {
            <path d="M12 3.5a5 5 0 0 1 5 5c0 2-1.2 3.2-2.2 4.2S13 19 12 19s-1.8-4.3-2.8-6.3S7 10.5 7 8.5a5 5 0 0 1 5-5z"></path>
            <circle cx="12" cy="8.5" r="1.6"></circle>
          }
        }
      </svg>
      <div>
        <h3>{{ benefit.title }}</h3>
        <p>{{ benefit.body }}</p>
      </div>
    </div>
  `,
  styles: [`
    .ben { display: grid; grid-template-columns: 34px 1fr; gap: 16px; padding: 22px 0; border-top: 1px solid var(--ink-12); }
    .ico { width: 34px; height: 34px; color: var(--rust); }
    h3 { font-size: 19px; margin-bottom: 6px; }
    p { margin: 0; color: var(--ink-70); font-size: 16px; }
  `],
})
export class BenefitCard {
  @Input({ required: true }) benefit!: Benefit;
}
