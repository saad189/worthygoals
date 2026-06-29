import { Component, Input } from '@angular/core';
import { MissResponse } from '../../data/content';

/** How a mentor responds to a missed goal — tagged empathy / nudge / real talk. */
@Component({
  selector: 'wg-miss-card',
  standalone: true,
  template: `
    <div class="miss">
      <span class="tag" [class]="response.tagClass">{{ response.tag }}</span>
      <div>
        <div class="who">{{ response.who }}</div>
        <p>{{ response.body }}</p>
      </div>
    </div>
  `,
  styles: [`
    .miss {
      border: 1px solid var(--ink-08);
      border-radius: 16px;
      padding: 16px 18px;
      background: var(--surface);
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 14px;
      align-items: start;
    }
    .tag {
      font-family: var(--mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase;
      padding: 5px 9px; border-radius: 999px; white-space: nowrap; align-self: start;
    }
    .tag-warm { background: rgba(192, 65, 36, 0.10); color: var(--rust-ink); }
    .tag-nudge { background: rgba(26, 23, 20, 0.07); color: var(--ink-70); }
    .tag-real { background: var(--ink); color: var(--cream); }
    .who { font-weight: 600; font-size: 14px; margin-bottom: 3px; }
    p { margin: 0; font-family: var(--serif); font-style: italic; font-size: 16.5px; color: var(--ink-70); line-height: 1.4; }
  `],
})
export class MissCard {
  @Input({ required: true }) response!: MissResponse;
}
