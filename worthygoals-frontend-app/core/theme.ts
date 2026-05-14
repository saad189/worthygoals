/**
 * Worthy Goals — React Native Paper theme
 * ─────────────────────────────────────────────────────────────
 * Binds WG design tokens onto react-native-paper's colour slots.
 * All values come from `constants/tokens` — never hardcode here.
 *
 * Usage (components that use Paper components):
 *   import { theme } from '@/core';
 *   <Button theme={theme} />
 *
 * For plain RN components, prefer Colors[colorScheme] or useAppTheme().
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Palette, FontFamily } from '@/constants/tokens';

// ── Light theme (canonical) ───────────────────────────────────
export const theme = {
  ...MD3LightTheme,
  fonts: {
    ...MD3LightTheme.fonts,
    // Map Paper's type scale onto the Outfit family we ship
    bodyLarge:  { ...MD3LightTheme.fonts.bodyLarge,  fontFamily: FontFamily.sans },
    bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, fontFamily: FontFamily.sans },
    bodySmall:  { ...MD3LightTheme.fonts.bodySmall,  fontFamily: FontFamily.sans },
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, fontFamily: FontFamily.sans },
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, fontFamily: FontFamily.sans },
    headlineMedium: { ...MD3LightTheme.fonts.headlineMedium, fontFamily: FontFamily.sans },
  },
  colors: {
    ...MD3LightTheme.colors,
    // ── Brand ──────────────────────────────────────────────────
    primary:          Palette.accent,
    primaryContainer: Palette.accentSubtle,
    onPrimary:        Palette.white,
    onPrimaryContainer: Palette.accent,

    secondary:          Palette.inkMuted,
    secondaryContainer: 'rgba(139, 129, 116, 0.12)',
    onSecondary:        Palette.white,

    // ── Surfaces ───────────────────────────────────────────────
    background:         Palette.paper,
    surface:            Palette.paper,
    surfaceVariant:     Palette.canvas,
    onBackground:       Palette.ink,
    onSurface:          Palette.ink,
    onSurfaceVariant:   Palette.inkMuted,

    // ── Borders ────────────────────────────────────────────────
    outline:            'rgba(26, 23, 20, 0.20)',
    outlineVariant:     'rgba(26, 23, 20, 0.12)',

    // ── Status ─────────────────────────────────────────────────
    error:              Palette.errorBase,
    errorContainer:     Palette.errorSubtle,
    onError:            Palette.white,

    // ── Legacy slots (used by older components — keep for back-compat) ──
    text:        Palette.ink,
    textWhite:   Palette.white,
    buttonTheme: Palette.accent,
  },
} as const;

// ── Dark theme ────────────────────────────────────────────────
export const darkTheme = {
  ...MD3DarkTheme,
  fonts: theme.fonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary:          Palette.accent,
    primaryContainer: Palette.accentSubtleDark,
    onPrimary:        Palette.white,

    secondary:          Palette.inkMutedDark,
    secondaryContainer: 'rgba(107, 101, 96, 0.20)',
    onSecondary:        Palette.white,

    background:         Palette.paperDark,
    surface:            Palette.paperDark,
    surfaceVariant:     Palette.canvasDark,
    onBackground:       Palette.inkDark,
    onSurface:          Palette.inkDark,
    onSurfaceVariant:   Palette.inkMutedDark,

    outline:            'rgba(237, 232, 223, 0.20)',
    outlineVariant:     'rgba(237, 232, 223, 0.12)',

    error:              Palette.errorBase,
    errorContainer:     Palette.errorSubtle,
    onError:            Palette.white,

    text:        Palette.inkDark,
    textWhite:   Palette.white,
    buttonTheme: Palette.accent,
  },
} as const;