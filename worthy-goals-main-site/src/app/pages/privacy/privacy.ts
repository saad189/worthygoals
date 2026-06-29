import { Component } from '@angular/core';
import { PageShell } from '../../components/page-shell/page-shell';
import { PRIVACY } from '../../data/content';

/** Privacy policy page — placeholder shell; real copy to be drafted. */
@Component({
  selector: 'wg-privacy',
  standalone: true,
  imports: [PageShell],
  template: `
    <wg-page-shell [eyebrow]="page.eyebrow" [heading]="page.heading">
      <p>{{ page.note }}</p>
    </wg-page-shell>
  `,
})
export class Privacy {
  readonly page = PRIVACY;
}
