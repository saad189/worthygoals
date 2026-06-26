/**
 * Worthy Goals — Button (shell primitive)
 * ─────────────────────────────────────────────────────────────
 * The Hi-Fi CTA system (§0):
 *   primary  — full-width ink (black) pill, the dominant CTA
 *   accent   — rust pill, reserved for stake/intensity moments
 *   link     — quiet text, the secondary "I already have an account" door
 */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import Text from './Text';

type Variant = 'primary' | 'accent' | 'link';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Full-width pill (default true for primary/accent). */
  block?: boolean;
  style?: ViewStyle;
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  block = true,
  style,
}: Props) {
  const { colors, space, radius } = useAppTheme();
  const isLink = variant === 'link';
  const bg = variant === 'accent' ? colors.primary : colors.text;
  const labelColor = isLink ? 'textMuted' : 'white';

  const containerStyle: ViewStyle = isLink
    ? { paddingVertical: space['3'], alignItems: 'center' }
    : {
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingVertical: space['4'],
        paddingHorizontal: space['6'],
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: block ? 'stretch' : 'center',
      };

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [containerStyle, pressed ? styles.pressed : null, disabled ? styles.disabled : null, style]}
    >
      {loading ? (
        <ActivityIndicator color={isLink ? colors.textMuted : colors.white} />
      ) : (
        <Text variant="label" color={labelColor}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
});
