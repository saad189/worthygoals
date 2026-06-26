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
};

export default function Card({ children, selected = false, onPress, style }: Props) {
  const { colors, space, radius, shadow } = useAppTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
    borderColor: selected ? colors.text : colors.border,
    padding: space['5'],
    ...(selected ? shadow.md : shadow.sm),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed ? styles.pressed : null, style]}
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
