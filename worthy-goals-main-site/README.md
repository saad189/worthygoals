# Worthy Goals — Main Marketing Site

The public-facing site for Worthy Goals (Evolve). Angular 22 standalone app
implementing two pages from the brand prototype:

| Route        | Page          | Purpose                                   |
| ------------ | ------------- | ----------------------------------------- |
| `/`          | Waitlist      | Landing page + early-access email capture |
| `/thank-you` | Thank you     | Post-signup confirmation, referral, teaser |

Submitting either capture form routes to `/thank-you`.

## Brand system

Warm-paper theme matching the Worthy Goals Hi-Fi: Paper `#F4EFE3`, Ink
`#1A1714`, Rust `#C04124`. Fonts: **Geist** (sans), **Newsreader** (serif),
**JetBrains Mono** (mono), loaded from Google Fonts in `src/index.html`.
Design tokens and shared utilities live in `src/styles.scss`.

## Where things are

```
src/app/
  data/content.ts        ← ALL copy lives here as typed constants (edit text here)
  shared/reveal.directive.ts  ← scroll-reveal (IntersectionObserver)
  components/            ← reusable, presentational pieces
    wordmark/            ·  logo
    nav-bar/             ·  sticky nav
    site-footer/         ·  landing footer
    email-capture/       ·  reactive waitlist form (hero + CTA variants)
    mentor-message-card/ ·  hero "delivered" message bubble
    mentor-card/         ·  roster card
    miss-card/           ·  "when you miss" response card
    step-card/           ·  how-it-works step
    benefit-card/        ·  launch-benefit row (keyed SVG icon)
    faq-item/            ·  accordion entry
  pages/
    waitlist/            ·  composes every landing section
    thank-you/           ·  confirmation + share
```

**To change any text**, edit `src/app/data/content.ts` — components are
presentational and read from those constants.

## Wiring the waitlist form to a real provider

`<wg-email-capture>` simulates success when no endpoint is set. Pass a
Formspree/Tally/ConvertKit POST URL to send for real:

```html
<wg-email-capture endpoint="https://formspree.io/f/xxxxxx" />
```

The share/landing URL and invite copy used on the thank-you page are in
`BRAND` and `THANK_YOU` in `content.ts`.

## Develop

```bash
npm start        # ng serve  → http://localhost:4200
npm run build    # production build → dist/
npm test         # unit tests
```
