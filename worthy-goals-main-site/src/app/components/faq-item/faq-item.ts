import { Component, HostListener, Input, signal } from '@angular/core';
import { FaqItem as FaqItemData } from '../../data/content';

let faqUid = 0;

/**
 * A single expandable FAQ entry with an animated open/close (height + a
 * plus→minus icon morph). Built as a button + region rather than native
 * <details> so the panel height can transition; answer is HTML so it can
 * embed links.
 */
@Component({
  selector: 'wg-faq-item',
  standalone: true,
  template: `
    <div class="faq" [class.open]="open()">
      <h3 class="faq-h">
        <button
          type="button"
          class="faq-q"
          [id]="btnId"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="panelId"
          (click)="toggle()"
        >
          <span class="faq-q-text">{{ item.q }}</span>
          <span class="faq-icon" aria-hidden="true">
            <i class="bar bar-h"></i>
            <i class="bar bar-v"></i>
          </span>
        </button>
      </h3>
      <div class="faq-panel" [id]="panelId" role="region" [attr.aria-labelledby]="btnId">
        <div class="faq-panel-inner">
          <div class="faq-a" [innerHTML]="item.a"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .faq { border-bottom: 1px solid var(--ink-12); }
    .faq-h { margin: 0; font-weight: inherit; font-size: inherit; letter-spacing: normal; line-height: inherit; }

    .faq-q {
      width: 100%; background: none; border: 0; cursor: pointer; text-align: left;
      display: flex; align-items: center; justify-content: space-between; gap: 24px;
      padding: 24px 6px 24px 0;
      font-family: var(--sans); color: var(--ink);
      font-size: clamp(18px, 2.2vw, 22px); font-weight: 500; letter-spacing: -0.01em;
    }

    /* plus → minus morph */
    .faq-icon { position: relative; width: 22px; height: 22px; flex: none; }
    .bar { position: absolute; background: var(--rust); border-radius: 2px; }
    .bar-h { top: 50%; left: 0; width: 22px; height: 2px; transform: translateY(-50%); }
    .bar-v {
      left: 50%; top: 0; width: 2px; height: 22px; transform: translateX(-50%);
      transition: transform .3s cubic-bezier(.2, .7, .2, 1);
    }
    .faq.open .bar-v { transform: translateX(-50%) scaleY(0); }

    /* height animation via animatable grid-template-rows (0fr → 1fr) */
    .faq-panel {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows .32s cubic-bezier(.2, .7, .2, 1);
    }
    .faq.open .faq-panel { grid-template-rows: 1fr; }
    .faq-panel-inner { overflow: hidden; min-height: 0; }

    .faq-a {
      padding: 0 0 26px; color: var(--ink-70); font-size: 17px; max-width: 64ch;
      opacity: 0; transition: opacity .28s ease .04s;
    }
    .faq.open .faq-a { opacity: 1; }

    ::ng-deep .faq-a a, ::ng-deep .faq-link {
      color: var(--rust-ink); text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
    }

    @media (prefers-reduced-motion: reduce) {
      .faq-panel, .bar-v, .faq-a { transition: none; }
    }
  `],
})
export class FaqItem {
  @Input({ required: true }) item!: FaqItemData;

  readonly open = signal(false);

  private readonly uid = faqUid++;
  readonly panelId = `faq-panel-${this.uid}`;
  readonly btnId = `faq-q-${this.uid}`;

  toggle(): void {
    this.open.update((v) => !v);
  }

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
