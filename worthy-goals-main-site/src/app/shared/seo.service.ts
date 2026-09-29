import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { BRAND } from '../data/content';

/**
 * Per-route metadata: title, description, canonical, Open Graph, Twitter card
 * and JSON-LD.
 *
 * Angular's Meta service was never used anywhere, so all four routes shared
 * one description from index.html, none had a canonical, and there was no
 * Open Graph or Twitter card at all — a shared link rendered as a bare URL.
 * That matters here more than usual: shared links are the site's distribution.
 *
 * Because every route is prerendered, whatever this sets ends up in the static
 * HTML, which is what non-Google crawlers read.
 *
 * ponytail: og:image is the 512x512 app icon, so the card is `summary` (a
 * square thumbnail). Produce a 1200x630 share image and this becomes
 * `summary_large_image` — the only change needed is SHARE_IMAGE and the card
 * type.
 */
const SHARE_IMAGE = `${BRAND.landingUrl}/apple-touch-icon.png`;
const TWITTER_CARD = 'summary';

export interface PageSeo {
  title: string;
  description: string;
  /** Route path without a leading slash; '' for the home page. */
  path: string;
  /** Keep the page out of the index (e.g. post-signup confirmation). */
  noindex?: boolean;
  /** Optional schema.org payload for this page. */
  jsonLd?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly document = inject(DOCUMENT);

  apply(page: PageSeo): void {
    const url = `${BRAND.landingUrl}/${page.path}`.replace(/\/$/, '') || BRAND.landingUrl;

    this.titleService.setTitle(page.title);

    this.setName('description', page.description);
    this.setName('robots', page.noindex ? 'noindex, follow' : 'index, follow');

    this.setProperty('og:type', 'website');
    this.setProperty('og:site_name', BRAND.name);
    this.setProperty('og:title', page.title);
    this.setProperty('og:description', page.description);
    this.setProperty('og:url', url);
    this.setProperty('og:image', SHARE_IMAGE);

    this.setName('twitter:card', TWITTER_CARD);
    this.setName('twitter:title', page.title);
    this.setName('twitter:description', page.description);
    this.setName('twitter:image', SHARE_IMAGE);

    this.setCanonical(url);
    this.setJsonLd(page.jsonLd);
  }

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(data?: Record<string, unknown>): void {
    const head = this.document.head;
    const existing = head.querySelector('script[type="application/ld+json"]');
    if (existing) existing.remove();
    if (!data) return;

    const script = this.document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(data);
    head.appendChild(script);
  }
}
