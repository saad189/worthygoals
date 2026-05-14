/**
 * Worthy Goals — Design Token Primitives
 * ─────────────────────────────────────────────────────────────
 * Single source of truth. Every colour in the app must trace
 * back to a value in this file.
 *
 * Primitive tokens are raw values — no semantic meaning here.
 * Semantic meaning lives in Colors.ts (per-scheme) and theme.ts
 * (react-native-paper binding).
 *
 * DO NOT import this file directly in components or screens.
 * Import `Colors` or `useAppTheme` instead.
 */

// ── Core Palette ─────────────────────────────────────────────
export const Palette = {
  // Brand
  paper:        '#F4EFE3', // warm cream — primary light surface
  canvas:       '#EFE9D8', // slightly darker warm — secondary light surface
  ink:          '#1A1714', // dark charcoal — primary text & UI on light
  inkMuted:     '#8B8174', // warm grey — secondary text
  inkFaint:     '#C9C3B8', // very warm grey — dividers, placeholders
  accent:       '#C04124', // burnt orange/rust — CTAs, highlights

  // Dark mode counterparts (warm inversion)
  paperDark:    '#1A1714', // same as ink — becomes the dark surface
  canvasDark:   '#141210', // slightly deeper warm dark
  inkDark:      '#EDE8DF', // off-white warm — primary text on dark
  inkMutedDark: '#6B6560', // muted on dark
  inkFaintDark: '#2D2926', // very faint on dark — dividers

  // Accent shades
  accentLight:  '#E0633E', // lighter rust for hover/pressed states
  accentDark:   '#9E3319', // deeper rust
  accentSubtle: 'rgba(192, 65,  36, 0.12)', // tinted background (light)
  accentSubtleDark: 'rgba(192, 65, 36, 0.18)', // tinted background (dark)

  // Semantic status
  successBase:  '#2D7A4F',
  successSubtle:'rgba(45, 122, 79, 0.12)',
  warningBase:  '#B07A1A',
  warningSubtle:'rgba(176, 122, 26, 0.12)',
  errorBase:    '#C04124', // reuse accent (brand-aligned)
  errorSubtle:  'rgba(192, 65, 36, 0.10)',
  infoBase:     '#3A6EA8',
  infoSubtle:   'rgba(58, 110, 168, 0.12)',

  // Absolute
  white:  '#FFFFFF',
  black:  '#000000',
  transparent: 'transparent',
} as const;

// ── Typography ────────────────────────────────────────────────
export const FontFamily = {
  /** All UI: headings, labels, body */
  sans:        'Outfit',
  /** Fallback for Geist (when web fonts are loaded) */
  sansAlt:     'Geist',
  /** Personality voice, long-form narrative */
  serif:       'Newsreader',
  /** Code blocks, timestamps, data */
  mono:        'JetBrains Mono',
  /** System fallback chain */
  system:      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export const FontSize = {
  '2xs': 10,
  xs:    11,
  sm:    13,
  base:  15,
  md:    17,
  lg:    20,
  xl:    24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,
} as const;

export const FontWeight = {
  light:    '300' as const,
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
} as const;

export const LineHeight = {
  tight:   1.2,
  snug:    1.35,
  normal:  1.5,
  relaxed: 1.65,
} as const;

// ── Spacing (8-pt grid) ───────────────────────────────────────
export const Space = {
  '0':   0,
  '1':   4,
  '2':   8,
  '3':   12,
  '4':   16,
  '5':   20,
  '6':   24,
  '8':   32,
  '10':  40,
  '12':  48,
  '16':  64,
  '20':  80,
} as const;

// ── Border Radius ─────────────────────────────────────────────
export const Radius = {
  none: 0,
  xs:   4,
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  pill: 9999,
} as const;

// ── Elevation / Shadow ────────────────────────────────────────
export const Shadow = {
  none: {
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Palette.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ── Animation ─────────────────────────────────────────────────
export const Duration = {
  instant: 0,
  fast:    150,
  normal:  250,
  slow:    400,
  xslow:   600,
} as const;

export const Easing = {
  standard:    'ease-in-out',
  decelerate:  'ease-out',
  accelerate:  'ease-in',
} as const;
