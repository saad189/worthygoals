import { Component, Input } from '@angular/core';

/**
 * "The Cradle" (1C) brand mark: a mentor's arc holds the space while a seed
 * sprouts up out of it — arc (ink), stem + one leaf (rust), one leaf (ink).
 * Ported from the Claude Design "Worthy Goals Logo" prototype, option 1C.
 *
 * Pass [animate]="true" to play the draw-on once (arc → stem → leaves). Colors
 * come from CSS vars so a caller can recolor for dark/mono contexts by setting
 * --logo-ink / --logo-acc on an ancestor.
 */
@Component({
  selector: 'wg-logo-mark',
  standalone: true,
  template: `
    <svg viewBox="0 0 64 64" class="mark" [class.animate]="animate" [style.width.px]="size" [style.height.px]="size"
         role="img" [attr.aria-label]="title" fill="none">
      <path class="arc"  d="M13 32 A 19 19 0 0 0 51 32" pathLength="1" stroke="var(--logo-ink, #1A1714)" stroke-width="3.6" stroke-linecap="round"/>
      <path class="stem" d="M32 41 C 32 35 32 29 32 23"  pathLength="1" stroke="var(--logo-acc, #C04124)" stroke-width="3.2" stroke-linecap="round"/>
      <path class="leaf leaf-l" d="M32 30.5 C 27 30.5 22 26.5 21.5 20.5 C 27 21.5 31 25 32 30.5 Z" fill="var(--logo-acc, #C04124)"/>
      <path class="leaf leaf-r" d="M32 27 C 37 27 42 23.5 42.5 18 C 37 19 33 22.5 32 27 Z"        fill="var(--logo-ink, #1A1714)"/>
    </svg>
  `,
  styles: [`
    .mark { display: block; overflow: visible; }
    .leaf { transform-box: fill-box; transform-origin: 50% 100%; }

    /* Draw-on: arc sweeps, stem grows, leaves sprout. Runs once (no loop). */
    .mark.animate .arc  { stroke-dasharray: 1; stroke-dashoffset: 1; animation: mark-draw .55s ease forwards; }
    .mark.animate .stem { stroke-dasharray: 1; stroke-dashoffset: 1; animation: mark-draw .40s ease .45s forwards; }
    .mark.animate .leaf { opacity: 0; transform: scale(.2); animation: mark-sprout .45s cubic-bezier(.2,.8,.2,1) forwards; }
    .mark.animate .leaf-l { animation-delay: .80s; }
    .mark.animate .leaf-r { animation-delay: .95s; }

    @keyframes mark-draw   { to { stroke-dashoffset: 0; } }
    @keyframes mark-sprout { to { opacity: 1; transform: scale(1); } }

    @media (prefers-reduced-motion: reduce) {
      .mark.animate .arc, .mark.animate .stem { stroke-dasharray: none; stroke-dashoffset: 0; animation: none; }
      .mark.animate .leaf { opacity: 1; transform: none; animation: none; }
    }
  `],
})
export class LogoMark {
  /** Square px size of the mark. */
  @Input() size = 22;
  /** Play the draw-on animation once on render. */
  @Input() animate = false;
  /** Accessible label (the wordmark already labels the link, so default is empty/decorative). */
  @Input() title = '';
}
