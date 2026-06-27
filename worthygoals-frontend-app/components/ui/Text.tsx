/**
 * Worthy Goals — Text (typography primitive)
 * ─────────────────────────────────────────────────────────────
 * The single font router. Every brand text style flows through a `variant`
 * here, so no screen hardcodes a font family, size, or weight (E-4 / §F).
 *
 * Type roles (Hi-Fi §0):
 *   display      — Newsreader italic, the editorial product voice
 *   title        — Geist semibold, section headings
 *   body / muted — Geist, primary / secondary copy
 *   label        — Geist medium, button + field labels
 *   eyebrow      — JetBrains Mono, uppercase letter-spaced metadata
 *   mono         — JetBrains Mono, inline structured data
 */
import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useAppTheme, AppTheme } from '@/hooks/useAppTheme';

export type TextVariant =
  | 'display'
  | 'title'
  | 'body'
  | 'muted'
  | 'label'
  | 'eyebrow'
  | 'mono';

type ColorKey = keyof AppTheme['colors'];

export type AppTextProps = RNTextProps & {
  variant?: TextVariant;
  /** Semantic colour token; overrides the variant default. */
  color?: ColorKey;
};

function variantStyle(variant: TextVariant, t: AppTheme): { style: TextStyle; color: ColorKey } {
  const { fonts, fontSizes, fontWeights } = t;
  switch (variant) {
    case 'display':
      return {
        color: 'text',
        style: { fontFamily: fonts.serifItalic, fontSize: fontSizes['3xl'], lineHeight: fontSizes['3xl'] * 1.1 },
      };
    case 'title':
      return {
        color: 'text',
        style: { fontFamily: fonts.sans, fontSize: fontSizes.lg, fontWeight: fontWeights.semibold },
      };
    case 'body':
      return {
        color: 'text',
        style: { fontFamily: fonts.sans, fontSize: fontSizes.base, lineHeight: fontSizes.base * 1.5 },
      };
    case 'muted':
      return {
        color: 'textMuted',
        style: { fontFamily: fonts.sans, fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5 },
      };
    case 'label':
      return {
        color: 'text',
        style: { fontFamily: fonts.sans, fontSize: fontSizes.base, fontWeight: fontWeights.medium },
      };
    case 'eyebrow':
      return {
        color: 'textMuted',
        style: {
          fontFamily: fonts.mono,
          fontSize: fontSizes['2xs'],
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        },
      };
    case 'mono':
      return {
        color: 'textMuted',
        style: { fontFamily: fonts.mono, fontSize: fontSizes.xs },
      };
  }
}

export default function Text({ variant = 'body', color, style, ...rest }: AppTextProps) {
  const theme = useAppTheme();
  const v = variantStyle(variant, theme);
  const resolved = theme.colors[color ?? v.color] as string;
  return <RNText style={[v.style, { color: resolved }, style]} {...rest} />;
}
