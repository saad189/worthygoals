/**
 * Worthy Goals — useAppTheme
 * ─────────────────────────────────────────────────────────────
 * The ONE hook components should call to get theme values.
 * Unifies the two previously split systems (Colors + core/theme)
 * behind a single, scheme-aware interface.
 *
 * Returns:
 *   colors      — semantic colour tokens for the active scheme
 *   scheme      — 'light' | 'dark'
 *   isDark      — boolean shorthand
 *   paperTheme  — the react-native-paper MD3 theme object
 *   fonts       — FontFamily tokens
 *   space       — 8-pt spacing grid
 *   radius      — border radius scale
 *   shadow      — shadow presets
 *   duration    — animation duration tokens
 *
 * Usage:
 *   const { colors, space, radius } = useAppTheme();
 *   <View style={{ backgroundColor: colors.background, padding: space['4'] }} />
 */

import { useColorScheme } from 'react-native';
import { Colors, AppColors } from '@/constants/Colors';
import {
  FontFamily,
  FontSize,
  FontWeight,
  Space,
  Radius,
  Shadow,
  Duration,
} from '@/constants/tokens';
import { theme as lightPaperTheme, darkTheme as darkPaperTheme } from '@/core/theme';

export type AppTheme = {
  colors:     AppColors;
  scheme:     'light' | 'dark';
  isDark:     boolean;
  paperTheme: typeof lightPaperTheme;
  fonts:      typeof FontFamily;
  fontSizes:  typeof FontSize;
  fontWeights:typeof FontWeight;
  space:      typeof Space;
  radius:     typeof Radius;
  shadow:     typeof Shadow;
  duration:   typeof Duration;
};

export function useAppTheme(): AppTheme {
  const scheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const isDark  = scheme === 'dark';

  return {
    colors:      Colors[scheme],
    scheme,
    isDark,
    paperTheme:  isDark ? darkPaperTheme : lightPaperTheme,
    fonts:       FontFamily,
    fontSizes:   FontSize,
    fontWeights: FontWeight,
    space:       Space,
    radius:      Radius,
    shadow:      Shadow,
    duration:    Duration,
  };
}
