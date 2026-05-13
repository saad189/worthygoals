/**
 * Worthy Goals — Themed primitives
 *
 * Thin wrappers around RN Text/View that automatically pull colours
 * from the WG design token system (`constants/Colors`).
 *
 * Override per-instance with the lightColor/darkColor escape hatch,
 * or use the raw `useThemeColor` hook for custom components.
 */

import { Text as DefaultText, View as DefaultView } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

/**
 * Returns a resolved colour from the active theme.
 * Falls back to the lightColor/darkColor prop override if provided.
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
): string {
  const scheme = useColorScheme() ?? 'light';
  const colorFromProps = props[scheme];
  return colorFromProps ?? Colors[scheme][colorName];
}

/** Theme-aware Text. Defaults to `colors.text`. */
export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

/** Theme-aware View. Defaults to `colors.background`. */
export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background',
  );
  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

/** Muted text — uses `colors.textMuted`. */
export function MutedText(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'textMuted');
  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

/** Canvas-coloured surface — uses `colors.canvas` (slightly darker than background). */
export function Canvas(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'canvas',
  );
  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
