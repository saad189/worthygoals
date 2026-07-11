import { Routes } from '@angular/router';
import { BRAND } from './data/content';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/waitlist/waitlist').then((m) => m.Waitlist),
    title: `${BRAND.name} — Accountability with a pulse`,
  },
  {
    path: 'thank-you',
    loadComponent: () => import('./pages/thank-you/thank-you').then((m) => m.ThankYou),
    title: `You're in — ${BRAND.name}`,
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy),
    title: `Privacy — ${BRAND.name}`,
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
    title: `Contact — ${BRAND.name}`,
  },
  { path: '**', redirectTo: '' },
];
