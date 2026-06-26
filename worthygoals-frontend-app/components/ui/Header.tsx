/**
 * Worthy Goals — Header (shell primitive)
 * ─────────────────────────────────────────────────────────────
 * The editorial screen headline: a mono eyebrow over a big Newsreader-italic
 * display line — the recurring header on nearly every Hi-Fi screen (§0).
 */
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import Text from './Text';

type Props = {
  title: string;
  /** Small uppercase mono label above the title (e.g. "WORTHY GOALS · V1"). */
  eyebrow?: string;
  align?: 'left' | 'center';
  style?: ViewStyle;
};

export default function Header({ title, eyebrow, align = 'left', style }: Props) {
  const { space } = useAppTheme();
  const alignment = align === 'center' ? 'center' : 'flex-start';
  return (
    <View style={[{ alignItems: alignment, marginBottom: space['5'] }, style]}>
      {eyebrow ? (
        <Text variant="eyebrow" style={{ marginBottom: space['2'], textAlign: align }}>
          {eyebrow}
        </Text>
      ) : null}
      <Text variant="display" style={{ textAlign: align }}>
        {title}
      </Text>
    </View>
  );
}
