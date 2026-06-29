import { Directive, ElementRef, OnInit, inject } from '@angular/core';

/**
 * Adds the `in` class when the host scrolls into view, driving the
 * `.reveal` fade-up defined in global styles. Respects reduced-motion
 * (CSS handles the no-animation case) and reveals immediately if
 * IntersectionObserver is unavailable so content is never trapped hidden.
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements OnInit {
  private el = inject(ElementRef<HTMLElement>);

  ngOnInit(): void {
    const node = this.el.nativeElement;
    node.classList.add('reveal');

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('in');
      return;
    }

    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            obs.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(node);
  }
}
