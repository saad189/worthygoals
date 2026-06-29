import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/waitlist/waitlist').then((m) => m.Waitlist),
    title: 'Worthy Goals — Accountability with a pulse',
  },
  {
    path: 'thank-you',
    loadComponent: () => import('./pages/thank-you/thank-you').then((m) => m.ThankYou),
    title: "You're in — Worthy Goals",
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy),
    title: 'Privacy — Worthy Goals',
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
    title: 'Contact — Worthy Goals',
  },
  { path: '**', redirectTo: '' },
];
