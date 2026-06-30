/**
 * Worthy Goals — StepDots (shell primitive)
 * ─────────────────────────────────────────────────────────────
 * The wizard / onboarding progress indicator (Hi-Fi §0 `StepDots`). The active
 * dot stretches to a 16px bar, the rest are 4px dots; every dot up to and
 * including the active one is inked, the remainder are hairline. Exact match to
 * the design-system token scale (active 16×4, inactive 4×4, radius 2, gap 4).
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  total: number;
  /** Zero-based index of the current step. */
  active: number;
  style?: ViewStyle;
};

export default function StepDots({ total, active, style }: Props) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: active + 1 }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 16 : 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: i <= active ? colors.text : colors.border,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
