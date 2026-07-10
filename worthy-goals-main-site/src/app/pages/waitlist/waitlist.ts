import { Component } from '@angular/core';
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
import { BENEFITS, CAPTURE, CTA, FAILURE, FAQ, HERO, HOW, MENTORS, PROBLEM } from '../../data/content';

/** The Worthy Goals waitlist landing page (flow: hero → proof → CTA → FAQ). */
@Component({
  selector: 'wg-waitlist',
  standalone: true,
  imports: [
    NavBar, SiteFooter, EmailCapture, MentorMessageCard, StepCard,
    MentorCard, MissCard, BenefitCard, FaqItem, TaskFlow, RevealDirective,
  ],
  templateUrl: './waitlist.html',
  styleUrl: './waitlist.scss',
})
export class Waitlist {
  readonly hero = HERO;
  readonly problem = PROBLEM;
  readonly how = HOW;
  readonly mentors = MENTORS;
  readonly failure = FAILURE;
  readonly benefits = BENEFITS;
  readonly cta = CTA;
  readonly faq = FAQ;
  readonly capture = CAPTURE;
}
