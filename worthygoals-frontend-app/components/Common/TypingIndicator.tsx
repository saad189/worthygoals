import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { useAppTheme } from '@/hooks/useAppTheme';

const DOT_SIZE = 8;
const DELAYS = [0, 160, 320];

type Props = {
  /** Dot colour — defaults to muted ink; chat passes the mentor accent. */
  color?: string;
};

export default function TypingIndicator({ color }: Props) {
  const { colors, radius } = useAppTheme();

  return (
    <View
      style={[styles.bubble, { backgroundColor: colors.bubbleOther, borderRadius: radius.md }]}
      accessibilityLabel="Mentor is typing"
      accessibilityLiveRegion="polite"
    >
      {DELAYS.map((delay, i) => (
        <MotiView
          key={i}
          from={{ translateY: 0, opacity: 0.4 }}
          animate={{ translateY: -5, opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 400,
            delay,
            loop: true,
            repeatReverse: true,
          }}
          style={[styles.dot, { backgroundColor: color ?? colors.textMuted }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
    margin: 10,
    gap: 5,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
