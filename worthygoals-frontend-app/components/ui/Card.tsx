/**
 * Worthy Goals — Card (shell primitive)
 * ─────────────────────────────────────────────────────────────
 * Paper surface with a hairline border. `selected` swaps to an ink border +
 * slight lift — the selectable-card pattern from the Hi-Fi personality pickers
 * (§0). Becomes a Pressable when `onPress` is provided.
 */
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  children: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  /** Spoken name when pressable; defaults to the card's text content. */
  accessibilityLabel?: string;
};

export default function Card({
  children,
  selected = false,
  onPress,
  style,
  accessibilityLabel,
}: Props) {
  const { colors, space, radius, shadow } = useAppTheme();

  // ponytail: border grows on select, so pad by the difference — border + padding
  // stays constant and the card doesn't grow/shift the content under it.
  const borderWidth = selected ? 1.5 : StyleSheet.hairlineWidth;

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth,
    borderColor: selected ? colors.text : colors.border,
    padding: space['5'] - borderWidth,
    ...(selected ? shadow.md : shadow.sm),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed ? styles.pressed : null, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        // The picker cards' selected state was visual only (the ink border).
        accessibilityState={{ selected }}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[cardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
});
