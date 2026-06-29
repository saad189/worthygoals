import { Component, Input } from '@angular/core';
import { MentorCardData } from '../../data/content';

/** Roster card: crest, name + archetype, philosophy, and a sample quote. */
@Component({
  selector: 'wg-mentor-card',
  standalone: true,
  template: `
    <article class="card">
      <div class="crest" [style.background]="mentor.color" aria-hidden="true">{{ mentor.initial }}</div>
      <div class="cname">
        <h3>{{ mentor.name }}</h3>
        <span class="arch">{{ mentor.archetype }}</span>
      </div>
      <p class="phil">{{ mentor.philosophy }}</p>
      <div class="quote">
        <span class="lbl">{{ mentor.quoteLabel }}</span>
        <p>{{ mentor.quote }}</p>
      </div>
    </article>
  `,
  styles: [`
    .card {
      background: var(--paper);
      border: 1px solid var(--ink-08);
      border-radius: 22px;
      padding: 26px 24px;
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: transform .25s cubic-bezier(.2, .7, .2, 1), box-shadow .25s ease;
    }
    .card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -24px rgba(26, 23, 20, 0.35); }
    .crest {
      width: 46px; height: 46px; border-radius: 50%;
      display: grid; place-items: center; color: var(--cream);
      font-family: var(--mono); font-weight: 500; font-size: 18px; margin-bottom: 18px;
    }
    .cname { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
    .cname h3 { font-size: 24px; }
    .arch { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-40); }
    .phil { font-family: var(--serif); font-style: italic; font-size: 18px; color: var(--ink-70); margin: 14px 0 22px; line-height: 1.4; }
    .quote { margin-top: auto; background: var(--surface); border-radius: 14px; padding: 15px 16px; border: 1px solid var(--ink-08); }
    .lbl { font-family: var(--mono); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-40); display: block; margin-bottom: 7px; }
    .quote p { margin: 0; font-size: 16px; line-height: 1.4; }
  `],
})
export class MentorCard {
  @Input({ required: true }) mentor!: MentorCardData;
}
