import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND } from '../../data/content';

/** The Worthy Goals logotype: rust dot + name. Links home by default. */
@Component({
  selector: 'wg-wordmark',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a [routerLink]="link" class="wordmark" [attr.aria-label]="brand.name + ' home'">
      <span class="dot" aria-hidden="true"></span>{{ brand.name }}
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
      gap: 9px;
    }
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--rust);
      display: inline-block;
      transform: translateY(1px);
    }
  `],
})
export class Wordmark {
  @Input() link = '/';
  readonly brand = BRAND;
}
