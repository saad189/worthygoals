import { Component } from '@angular/core';
import { PageShell } from '../../components/page-shell/page-shell';
import { CONTACT } from '../../data/content';

/** Contact page — placeholder shell; form/details to be added later. */
@Component({
  selector: 'wg-contact',
  standalone: true,
  imports: [PageShell],
  template: `
    <wg-page-shell [eyebrow]="page.eyebrow" [heading]="page.heading">
      <p>{{ page.note }}</p>
    </wg-page-shell>
  `,
})
export class Contact {
  readonly page = CONTACT;
}
