/**
 * Worthy Goals — Semantic Colour Tokens
 * ─────────────────────────────────────────────────────────────
 * All values derive from `constants/tokens.ts` (primitives).
 * Never import raw hex strings from here — use the semantic
 * names so a single primitive change propagates everywhere.
 *
 * Scheme: light = canonical WG warm-paper palette
 *         dark  = warm inverted palette (V1.5 target; wired now)
 */

import { Palette } from './tokens';

export const Colors = {
  light: {
    // ── Surfaces ──────────────────────────────────────────────
    background:   Palette.paper,          // primary screen background
    surface:      Palette.paper,          // cards, sheets
    canvas:       Palette.canvas,         // secondary surfaces, input bg

    // ── Text ──────────────────────────────────────────────────
    text:         Palette.ink,            // primary text
    textMuted:    Palette.inkMuted,       // secondary / caption text
    textFaint:    Palette.inkFaint,       // placeholders, disabled
    textWhite:    Palette.white,          // text on dark/accent surfaces
    textInactive: Palette.inkFaint,

    // ── Interactive ────────────────────────────────────────────
    tint:            Palette.accent,
    primary:         Palette.accent,
    primaryLight:    Palette.accentLight,
    primarySubtle:   Palette.accentSubtle,
    tabIconDefault:  Palette.inkMuted,
    tabIconSelected: Palette.accent,

    // ── Buttons ────────────────────────────────────────────────
    buttonBackground: Palette.accent,
    buttonText:       Palette.white,
    buttonOutlineBg:  Palette.transparent,
    buttonTheme:      Palette.accent,

    // ── Icons ──────────────────────────────────────────────────
    icon:               Palette.inkMuted,
    iconBackgroundColor:Palette.accentSubtle,

    // ── Borders & Dividers ─────────────────────────────────────
    border:    'rgba(26, 23, 20, 0.12)',
    divider:   'rgba(26, 23, 20, 0.08)',
    overlay:   'rgba(26, 23, 20, 0.06)',

    // ── Status ─────────────────────────────────────────────────
    notificationInfo:    Palette.infoSubtle,
    notificationSuccess: Palette.successSubtle,
    notificationError:   Palette.errorSubtle,
    dangerColor:         Palette.errorBase,

    // ── Chat bubble colours ─────────────────────────────────────
    bubbleSelf:    Palette.accent,
    bubbleSelfText:Palette.white,
    bubbleOther:   Palette.canvas,
    bubbleOtherText: Palette.ink,
  },

  dark: {
    // ── Surfaces ──────────────────────────────────────────────
    background:   Palette.paperDark,
    surface:      Palette.paperDark,
    canvas:       Palette.canvasDark,

    // ── Text ──────────────────────────────────────────────────
    text:         Palette.inkDark,
    textMuted:    Palette.inkMutedDark,
    textFaint:    Palette.inkFaintDark,
    textWhite:    Palette.white,
    textInactive: Palette.inkMutedDark,

    // ── Interactive ────────────────────────────────────────────
    tint:            Palette.accent,
    primary:         Palette.accent,
    primaryLight:    Palette.accentLight,
    primarySubtle:   Palette.accentSubtleDark,
    tabIconDefault:  Palette.inkMutedDark,
    tabIconSelected: Palette.accent,

    // ── Buttons ────────────────────────────────────────────────
    buttonBackground: Palette.accent,
    buttonText:       Palette.white,
    buttonOutlineBg:  Palette.transparent,
    buttonTheme:      Palette.accent,

    // ── Icons ──────────────────────────────────────────────────
    icon:               Palette.inkMutedDark,
    iconBackgroundColor:Palette.accentSubtleDark,

    // ── Borders & Dividers ─────────────────────────────────────
    border:    'rgba(237, 232, 223, 0.12)',
    divider:   'rgba(237, 232, 223, 0.08)',
    overlay:   'rgba(237, 232, 223, 0.06)',

    // ── Status ─────────────────────────────────────────────────
    notificationInfo:    Palette.infoSubtle,
    notificationSuccess: Palette.successSubtle,
    notificationError:   Palette.errorSubtle,
    dangerColor:         Palette.errorBase,

    // ── Chat bubble colours ─────────────────────────────────────
    bubbleSelf:    Palette.accent,
    bubbleSelfText:Palette.white,
    bubbleOther:   Palette.inkFaintDark,
    bubbleOtherText: Palette.inkDark,
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type AppColors = typeof Colors.light;
