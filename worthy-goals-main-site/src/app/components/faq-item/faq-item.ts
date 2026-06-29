import { Component, HostListener, Input } from '@angular/core';
import { FaqItem as FaqItemData } from '../../data/content';

/** A single expandable FAQ entry. Answer is HTML so it can embed links. */
@Component({
  selector: 'wg-faq-item',
  standalone: true,
  template: `
    <details>
      <summary>{{ item.q }}</summary>
      <div class="faq-a" [innerHTML]="item.a"></div>
    </details>
  `,
  styles: [`
    details { border-bottom: 1px solid var(--ink-12); }
    summary {
      list-style: none; cursor: pointer; padding: 24px 44px 24px 0; position: relative;
      font-size: clamp(18px, 2.2vw, 22px); font-weight: 500; letter-spacing: -0.01em;
    }
    summary::-webkit-details-marker { display: none; }
    summary::after {
      content: "+"; position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
      font-family: var(--mono); font-size: 22px; color: var(--rust); transition: transform .25s ease;
    }
    details[open] summary::after { content: "–"; }
    .faq-a { padding: 0 0 26px; color: var(--ink-70); font-size: 17px; max-width: 64ch; }
    ::ng-deep .faq-a a, ::ng-deep .faq-link { color: var(--rust-ink); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  `],
})
export class FaqItem {
  @Input({ required: true }) item!: FaqItemData;

  /** Smooth-scroll for in-page anchor links embedded in the answer HTML. */
  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const link = (event.target as HTMLElement)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href')!.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
}
