import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Every route is prerendered to a real HTML file at build time.
 *
 * The site previously shipped `<app-root></app-root>` and nothing else: no
 * server, ssr, prerender or outputMode in angular.json and @angular/ssr not
 * installed. Googlebot renders JS on a deferred second pass, but Bing,
 * LinkedIn, Slack, X and iMessage do not — and shared links are this site's
 * distribution.
 *
 * Prerender rather than SSR because hosting is Firebase static hosting. The
 * output stays a folder of files; it just contains real content now.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '**', renderMode: RenderMode.Prerender },
];
