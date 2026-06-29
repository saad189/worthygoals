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

// Use the app-level hook (pinned to 'light' for V1) rather than react-native's
// OS-following one, so forcing warm-light happens in exactly one place (E-3).
import { useColorScheme } from '@/components/useColorScheme';
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
  colors:     AppColors | typeof Colors.dark;
  /**
   * The active accent colour. Brand rust by default; when `useAppTheme` is
   * called with a mentor slug it becomes that personality's identity colour
   * (§F per-mentor theming) — so a screen can tint itself to a mentor without
   * touching layout. `bubbleRadius` carries the matching bubble shape.
   */
  accent:     string;
  bubbleRadius: number;
  scheme:     'light' | 'dark';
  isDark:     boolean;
  paperTheme: typeof lightPaperTheme | typeof darkPaperTheme;
  fonts:      typeof FontFamily;
  fontSizes:  typeof FontSize;
  fontWeights:typeof FontWeight;
  space:      typeof Space;
  radius:     typeof Radius;
  shadow:     typeof Shadow;
  duration:   typeof Duration;
};

/** Per-mentor accent + bubble shape — "each mentor in their own colour and bubble" (Hi-Fi §1). */
function mentorAccent(
  mentorId: string | undefined,
  colors: AppColors | typeof Colors.dark,
): { accent: string; bubbleRadius: number } {
  switch (mentorId) {
    case 'lyra':
      return { accent: colors.mentorLyra, bubbleRadius: Radius.lg };   // soft, rounded
    case 'goggs':
      return { accent: colors.mentorGoggs, bubbleRadius: Radius.xs };  // loud, sharp
    case 'marcus':
      return { accent: colors.mentorMarcus, bubbleRadius: Radius.md }; // steady square
    default:
      return { accent: colors.primary, bubbleRadius: Radius.md };
  }
}

/**
 * @param mentorId optional personality slug — tints `accent` (and `bubbleRadius`)
 *                 to that mentor. Omit for the neutral brand theme.
 */
export function useAppTheme(mentorId?: string): AppTheme {
  const scheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const isDark  = scheme === 'dark';
  const colors  = Colors[scheme];
  const { accent, bubbleRadius } = mentorAccent(mentorId, colors);

  return {
    colors,
    accent,
    bubbleRadius,
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
