import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/useAppTheme';

interface Props {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width = '100%', height = 16, radius = 8, style }: Props) {
  const { colors } = useAppTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.cardSurface, colors.surfaceGlass],
    ),
  }));

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius: radius },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonBlock({ style }: { style?: ViewStyle }) {
  return (
    <Animated.View style={[styles.block, style]}>
      <Skeleton height={20} width="60%" style={{ marginBottom: 10 }} />
      <Skeleton height={14} width="100%" style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="80%" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  block: {
    paddingVertical: 8,
  },
});
