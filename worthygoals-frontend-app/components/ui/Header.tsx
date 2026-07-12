/**
 * Worthy Goals — Header (shell primitive)
 * ─────────────────────────────────────────────────────────────
 * The editorial screen headline: a mono eyebrow over a big Newsreader-italic
 * display line — the recurring header on nearly every Hi-Fi screen (§0).
 */
import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import Text from './Text';

type Props = {
  title: string;
  /** Small uppercase mono label above the title (e.g. "WORTHY GOALS · V1"). */
  eyebrow?: string;
  align?: 'left' | 'center';
  /** Show a back affordance above the title; usually `() => router.back()`. */
  onBack?: () => void;
  /** Trailing controls (bell, profile avatar, action button…) on the title row. */
  right?: React.ReactNode;
  style?: ViewStyle;
};

export default function Header({ title, eyebrow, align = 'left', onBack, right, style }: Props) {
  const { space, colors } = useAppTheme();
  const alignment = align === 'center' ? 'center' : 'flex-start';
  return (
    <View style={[{ marginBottom: space['5'] }, style]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          style={({ pressed }) => [{ marginBottom: space['2'] }, pressed && { opacity: 0.6 }]}
        >
          <Text variant="eyebrow" style={{ color: colors.text }}>
            ‹ BACK
          </Text>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        {/* flex:1 keeps center-aligned titles centred and left titles flush-left. */}
        <View style={{ flex: 1, alignItems: alignment }}>
          {eyebrow ? (
            <Text variant="eyebrow" style={{ marginBottom: space['2'], textAlign: align }}>
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="display" style={{ textAlign: align }}>
            {title}
          </Text>
        </View>
        {right ? <View style={{ marginLeft: space['4'] }}>{right}</View> : null}
      </View>
    </View>
  );
}
