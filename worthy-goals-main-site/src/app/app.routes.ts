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
  { path: '**', redirectTo: '' },
];
