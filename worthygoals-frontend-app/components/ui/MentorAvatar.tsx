/**
 * Worthy Goals — MentorAvatar (shell primitive)
 * ─────────────────────────────────────────────────────────────
 * Each personality is a distinct colour + shape (Hi-Fi §1):
 *   Marcus — ink, rounded square   Lyra — slate-blue circle   Goggs — rust square
 * Keyed by personalityId slug so it stays in sync with the backend runtime.
 * Presentational only — the letter mark; photo avatars layer in later.
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme, AppTheme } from '@/hooks/useAppTheme';
import Text from './Text';

export type MentorId = 'marcus' | 'lyra' | 'goggs';

type Props = {
  /** personalityId slug; unknown ids fall back to a neutral ink square. */
  mentor?: string;
  size?: number;
  style?: ViewStyle;
};

function visual(mentor: string | undefined, colors: AppTheme['colors']) {
  switch (mentor) {
    case 'lyra':
      return { color: colors.mentorLyra, circle: true, letter: 'L' };
    case 'goggs':
      return { color: colors.mentorGoggs, circle: false, letter: 'G' };
    case 'marcus':
      return { color: colors.mentorMarcus, circle: false, letter: 'M' };
    default:
      return {
        color: colors.mentorMarcus,
        circle: false,
        letter: (mentor?.[0] ?? '?').toUpperCase(),
      };
  }
}

export default function MentorAvatar({ mentor, size = 40, style }: Props) {
  const { colors, radius } = useAppTheme();
  const v = visual(mentor, colors);
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: v.circle ? size / 2 : radius.md,
          backgroundColor: v.color,
        },
        style,
      ]}
    >
      <Text variant="title" color="white" style={{ fontSize: size * 0.42, lineHeight: size * 0.5 }}>
        {v.letter}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
