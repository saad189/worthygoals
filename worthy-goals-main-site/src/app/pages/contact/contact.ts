import { Component, OnInit, inject } from '@angular/core';
import { PageShell } from '../../components/page-shell/page-shell';
import { SeoService } from '../../shared/seo.service';
import { BRAND, CONTACT } from '../../data/content';

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
export class Contact implements OnInit {
  private readonly seo = inject(SeoService);

  readonly page = CONTACT;

  ngOnInit(): void {
    this.seo.apply({
      title: `Contact — ${BRAND.name}`,
      description: 'Get in touch with the Worthy Goals team.',
      path: 'contact',
    });
  }
}
