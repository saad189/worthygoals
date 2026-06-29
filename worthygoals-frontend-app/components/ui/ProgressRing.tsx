/**
 * Worthy Goals — ProgressRing (shell primitive)
 * ─────────────────────────────────────────────────────────────
 * The daily-progress dial on the today-first dashboard (Hi-Fi flow ③, U3).
 * A thin track + ink arc; the centre slot holds a count or percentage.
 * Pure tokens — colour comes from the theme, no raw hex.
 */
import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppTheme } from '@/hooks/useAppTheme';

type Props = {
  /** Completion fraction, 0–1. Clamped. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  /** Centre content (e.g. "2/3"). */
  children?: ReactNode;
  style?: ViewStyle;
};

export default function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 6,
  children,
  style,
}: Props) {
  const { colors } = useAppTheme();
  const clamped = Math.max(0, Math.min(1, isFinite(progress) ? progress : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.text}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // Start the arc at 12 o'clock.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}
