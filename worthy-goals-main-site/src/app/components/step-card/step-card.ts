import { Component, Input } from '@angular/core';
import { Step } from '../../data/content';

/** A numbered "how it works" step. */
@Component({
  selector: 'wg-step-card',
  standalone: true,
  template: `
    <div class="step">
      <div class="num">{{ step.num }}</div>
      <h3>{{ step.title }}</h3>
      <p>{{ step.body }}</p>
    </div>
  `,
  styles: [`
    .step { position: relative; }
    .num {
      font-family: var(--mono); font-size: 13px; color: var(--rust-ink);
      border: 1px solid var(--ink-12); border-radius: 999px;
      width: 38px; height: 38px; display: grid; place-items: center; margin-bottom: 20px;
    }
    h3 { margin-bottom: 10px; }
    p { color: var(--ink-70); margin: 0; font-size: 16.5px; }

    @media (max-width: 780px) {
      .step { padding: 28px 0; border-top: 1px solid var(--ink-12); }
    }
  `],
})
export class StepCard {
  @Input({ required: true }) step!: Step;
}
