/**
 * Worthy Goals — Button (shell primitive)
 * ─────────────────────────────────────────────────────────────
 * The Hi-Fi CTA system (§0):
 *   primary   — full-width ink (black) pill, the dominant CTA
 *   secondary — transparent pill, hairline border + ink text (the quieter
 *               sibling action, e.g. "Hold to talk" next to "Next →")
 *   accent    — rust pill, reserved for stake/intensity moments
 *   link      — quiet text, the secondary "I already have an account" door
 */
import React, { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import Text from './Text';

type Variant = 'primary' | 'secondary' | 'accent' | 'link';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Optional leading element (e.g. an icon) rendered before the label. */
  icon?: ReactNode;
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
  icon,
  block = true,
  style,
}: Props) {
  const { colors, space, radius } = useAppTheme();
  const isLink = variant === 'link';
  const isSecondary = variant === 'secondary';
  const bg = variant === 'accent' ? colors.primary : isSecondary ? 'transparent' : colors.text;
  const labelColor = isLink || isSecondary ? 'text' : 'white';

  const containerStyle: ViewStyle = isLink
    ? { paddingVertical: space['3'], alignItems: 'center' }
    : {
        backgroundColor: bg,
        borderRadius: radius.pill,
        borderWidth: isSecondary ? StyleSheet.hairlineWidth : 0,
        borderColor: isSecondary ? colors.border : 'transparent',
        paddingVertical: space['4'],
        paddingHorizontal: space['6'],
        flexDirection: 'row',
        gap: space['2'],
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: block ? 'stretch' : 'center',
      };

  // TouchableOpacity, not Pressable: Pressable does not receive touches inside
  // @gorhom/bottom-sheet's BottomSheetView, so every sheet CTA (Mark it done,
  // That's the truth, …) silently no-ops. TouchableOpacity works there and
  // everywhere else. activeOpacity replaces the old pressed-opacity.
  return (
    <TouchableOpacity
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={[containerStyle, disabled ? styles.disabled : null, style]}
    >
      {loading ? (
        <ActivityIndicator color={isLink || isSecondary ? colors.textMuted : colors.white} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text variant="label" color={labelColor}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.45 },
});
