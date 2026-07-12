/**
 * Worthy Goals — UserAvatar (shell primitive)
 * ─────────────────────────────────────────────────────────────
 * The signed-in user's identity chip: an ink square with their initials.
 * Deliberately distinct from MentorAvatar so "you" never reads as a mentor
 * (the app-bar profile button used to show the mentor's mark by mistake).
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import Text from './Text';

/** "Saad Ahmed" → "SA", "a@b.com" → "A", empty → "·". */
export function initialsOf(source: string): string {
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

type Props = {
  /** Display name or email; initials are derived from it. */
  name?: string | null;
  size?: number;
  style?: ViewStyle;
};

export default function UserAvatar({ name, size = 40, style }: Props) {
  const { colors, radius } = useAppTheme();
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: radius.lg, backgroundColor: colors.text },
        style,
      ]}
    >
      <Text
        variant="title"
        color="textWhite"
        style={{ fontSize: size * 0.4, lineHeight: size * 0.5 }}
      >
        {initialsOf(name ?? '')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
