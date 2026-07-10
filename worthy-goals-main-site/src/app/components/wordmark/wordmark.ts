import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoMark } from '../logo-mark/logo-mark';
import { BRAND } from '../../data/content';

/** The Worthy Goals logotype: cradle mark + name. Links home by default. */
@Component({
  selector: 'wg-wordmark',
  standalone: true,
  imports: [RouterLink, LogoMark],
  template: `
    <a [routerLink]="link" class="wordmark" [attr.aria-label]="brand.name + ' home'">
      <wg-logo-mark [size]="22" [animate]="animate" />{{ brand.name }}
    </a>
  `,
  styles: [`
    .wordmark {
      font-weight: 600;
      letter-spacing: -0.02em;
      font-size: 19px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
  `],
})
export class Wordmark {
  @Input() link = '/';
  /** Play the mark's draw-on once (used by the top nav on page load). */
  @Input() animate = false;
  readonly brand = BRAND;
}
