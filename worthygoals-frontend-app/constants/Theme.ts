/**
 * Worthy Goals — Theme System
 *
 * Single source of truth for all design tokens used across the app.
 * Structured for Tamagui/StyleSheet compatibility and eventual
 * per-personality theming (swap accent per mentor archetype).
 *
 * Usage:
 *   import { Theme, useTheme } from '@/constants/Theme';
 *   const theme = useTheme();  // returns light or dark tokens
 */

import { useColorScheme } from 'react-native';
import Colors, { Primitive } from './Colors';

// --- Typography ---
export const FontFamily = {
  /** Primary UI font — all headings, body, labels */
  sans: 'Geist',
  /** Personality voice / long-form narrative */
  serif: 'Newsreader',
  /** Code blocks, structured data, timestamps */
  mono: 'JetBrains Mono',
  /** Fallback chain */
  sansSystem: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
} as const;

export const FontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const LineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

// --- Spacing (8-pt grid) ---
export const Space = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
} as const;

// --- Radius ---
export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// --- Shadow ---
export const Shadow = {
  sm: {
    shadowColor: Primitive.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: Primitive.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Primitive.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// --- Animation durations ---
export const Duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// --- Full theme shape ---
export type AppTheme = {
  colors: typeof Colors.light;
  fonts: typeof FontFamily;
  fontSizes: typeof FontSize;
  fontWeights: typeof FontWeight;
  lineHeights: typeof LineHeight;
  space: typeof Space;
  radius: typeof Radius;
  shadow: typeof Shadow;
  duration: typeof Duration;
  isDark: boolean;
};

const buildTheme = (scheme: 'light' | 'dark'): AppTheme => ({
  colors: Colors[scheme],
  fonts: FontFamily,
  fontSizes: FontSize,
  fontWeights: FontWeight,
  lineHeights: LineHeight,
  space: Space,
  radius: Radius,
  shadow: Shadow,
  duration: Duration,
  isDark: scheme === 'dark',
});

export const Theme = {
  light: buildTheme('light'),
  dark: buildTheme('dark'),
} as const;

/**
 * Hook — returns the active theme based on device colour scheme.
 * Drop-in replacement for hardcoded theme references.
 *
 * const theme = useTheme();
 * <View style={{ backgroundColor: theme.colors.background }} />
 */
export function useTheme(): AppTheme {
  const scheme = useColorScheme() ?? 'light';
  return Theme[scheme];
}

export default Theme;
