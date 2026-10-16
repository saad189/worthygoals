import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { SiteFooter } from '../../components/site-footer/site-footer';
import { EmailCapture } from '../../components/email-capture/email-capture';
import { MentorMessageCard } from '../../components/mentor-message-card/mentor-message-card';
import { StepCard } from '../../components/step-card/step-card';
import { MentorCard } from '../../components/mentor-card/mentor-card';
import { MissCard } from '../../components/miss-card/miss-card';
import { BenefitCard } from '../../components/benefit-card/benefit-card';
import { FaqItem } from '../../components/faq-item/faq-item';
import { TaskFlow } from '../../components/task-flow/task-flow';
import { RevealDirective } from '../../shared/reveal.directive';
import { SeoService } from '../../shared/seo.service';
import { BENEFITS, BRAND, CAPTURE, CTA, FAILURE, FAQ, HERO, HOW, MENTORS, PROBLEM } from '../../data/content';

/** The Worthy Goals waitlist landing page (flow: hero → proof → CTA → FAQ). */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'wg-waitlist',
  standalone: true,
  imports: [
    NavBar, SiteFooter, EmailCapture, MentorMessageCard, StepCard,
    MentorCard, MissCard, BenefitCard, FaqItem, TaskFlow, RevealDirective,
  ],
  templateUrl: './waitlist.html',
  styleUrl: './waitlist.scss',
})
export class Waitlist implements OnInit {
  private readonly seo = inject(SeoService);

  readonly hero = HERO;
  readonly problem = PROBLEM;
  readonly how = HOW;
  readonly mentors = MENTORS;
  readonly failure = FAILURE;
  readonly benefits = BENEFITS;
  readonly cta = CTA;
  readonly faq = FAQ;
  readonly capture = CAPTURE;

  ngOnInit(): void {
    this.seo.apply({
      title: `${BRAND.name} — Accountability with a pulse`,
      description: HERO.sub,
      path: '',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            name: BRAND.name,
            url: BRAND.landingUrl,
            description: HERO.sub,
          },
          {
            '@type': 'Organization',
            name: BRAND.name,
            url: BRAND.landingUrl,
            email: BRAND.contactEmail,
            logo: `${BRAND.landingUrl}/apple-touch-icon.png`,
          },
          {
            // Generated from the same array the accordion renders, so the
            // markup and the page can never disagree.
            '@type': 'FAQPage',
            mainEntity: FAQ.items.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: {
                '@type': 'Answer',
                // The answers carry HTML for inline links; strip it for schema.
                text: item.a.replace(/<[^>]*>/g, ''),
              },
            })),
          },
        ],
      },
    });
  }
}
