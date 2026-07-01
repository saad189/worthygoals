/**
 * Worthy Goals — Field (shell primitive)
 * ─────────────────────────────────────────────────────────────
 * The Hi-Fi form input: a mono uppercase label over a warm canvas input with
 * a hairline border — quiet chrome, ink text (§0). `secure` adds a mono
 * SHOW/HIDE toggle; an error swaps the border + message to the danger tone.
 * Replaces the legacy react-native-paper SubComponents TextInput +
 * PasswordField (rust-filled pills from the old design system).
 */
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import Text from './Text';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  errorText?: string;
  /** Helper line under the field; hidden while an error is shown. */
  description?: string;
  /** Password-style entry with a mono SHOW/HIDE toggle. */
  secure?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function Field({
  label,
  errorText,
  description,
  secure = false,
  disabled = false,
  style,
  ...rest
}: Props) {
  const { colors, fonts, fontSizes, space, radius } = useAppTheme();
  const [hidden, setHidden] = useState(true);

  return (
    <View style={[styles.container, { marginBottom: space['4'] }, style]}>
      <Text variant="eyebrow" style={{ marginBottom: space['2'] }}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.canvas,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: errorText ? colors.dangerColor : colors.border,
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <TextInput
          editable={!disabled}
          placeholderTextColor={colors.textFaint}
          secureTextEntry={secure && hidden}
          accessibilityLabel={label}
          style={{
            flex: 1,
            color: colors.text,
            fontFamily: fonts.sans,
            fontSize: fontSizes.base,
            paddingVertical: space['3'],
            paddingHorizontal: space['4'],
          }}
          {...rest}
        />
        {secure ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            style={{ paddingHorizontal: space['4'] }}
          >
            <Text variant="eyebrow">{hidden ? 'show' : 'hide'}</Text>
          </Pressable>
        ) : null}
      </View>
      {errorText ? (
        <Text variant="muted" color="dangerColor" style={{ marginTop: space['2'] }}>
          {errorText}
        </Text>
      ) : description ? (
        <Text variant="muted" style={{ marginTop: space['2'] }}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
});
