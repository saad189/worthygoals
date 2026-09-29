import { Component, OnInit, inject } from '@angular/core';
import { PageShell } from '../../components/page-shell/page-shell';
import { SeoService } from '../../shared/seo.service';
import { BRAND, PRIVACY } from '../../data/content';

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
export class Privacy implements OnInit {
  private readonly seo = inject(SeoService);

  readonly page = PRIVACY;

  ngOnInit(): void {
    this.seo.apply({
      title: `Privacy — ${BRAND.name}`,
      description: 'How Worthy Goals handles your data.',
      path: 'privacy',
    });
  }
}
