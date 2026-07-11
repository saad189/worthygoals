/**
 * CradleMark — the Worthy Goals "Cradle" (1C) brand mark, animated.
 *
 * An arc (the mentor holding the space, ink) with a stem rising out of it
 * (rust) and two sprout leaves (rust + ink). With `animate`, it draws itself
 * on once — arc sweeps → stem grows → leaves sprout — matching the marketing
 * site's logo motion. Native splash can't animate on iOS, so this plays inside
 * a JS splash screen that visually continues the static native frame.
 *
 * Colours come from Palette tokens (hex-lint: no raw literals in components/).
 */
import React, { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Palette } from '@/constants/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

// Approximate path lengths (viewBox 0 0 64 64) with a little slack, so
// strokeDashoffset can retract from fully-hidden to fully-drawn.
const ARC_LEN = 62;
const STEM_LEN = 20;

// Timeline (ms) — mirrors logo-mark.ts on the web.
const T = {
  arc: { delay: 0, dur: 550 },
  stem: { delay: 450, dur: 400 },
  leafL: { delay: 800, dur: 450 },
  leafR: { delay: 950, dur: 450 },
  hold: 300, // pause after leaves before handing off
};
const TOTAL = T.leafR.delay + T.leafR.dur + T.hold;

const easeOut = Easing.out(Easing.cubic);
const easeSprout = Easing.bezier(0.2, 0.8, 0.2, 1);

type Props = {
  size?: number;
  /** Play the draw-on once on mount. When false, renders the finished mark. */
  animate?: boolean;
  /** Fired when the animation (or the reduced-motion fallback) completes. */
  onDone?: () => void;
};

export default function CradleMark({ size = 120, animate = true, onDone }: Props) {
  // Start hidden when animating, otherwise render the finished mark.
  const arcOffset = useSharedValue(animate ? ARC_LEN : 0);
  const stemOffset = useSharedValue(animate ? STEM_LEN : 0);
  const leafL = useSharedValue(animate ? 0 : 1);
  const leafR = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    let cancelled = false;

    const finish = () => {
      if (!cancelled) onDone?.();
    };

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        // Snap to final, skip the draw, hand off after a short beat.
        arcOffset.value = 0;
        stemOffset.value = 0;
        leafL.value = 1;
        leafR.value = 1;
        setTimeout(finish, 400);
        return;
      }
      arcOffset.value = withDelay(T.arc.delay, withTiming(0, { duration: T.arc.dur, easing: easeOut }));
      stemOffset.value = withDelay(T.stem.delay, withTiming(0, { duration: T.stem.dur, easing: easeOut }));
      leafL.value = withDelay(T.leafL.delay, withTiming(1, { duration: T.leafL.dur, easing: easeSprout }));
      leafR.value = withDelay(
        T.leafR.delay,
        withTiming(1, { duration: T.leafR.dur, easing: easeSprout }, (done) => {
          if (done) runOnJS(finish)();
        }),
      );
    });

    // Safety net so a dropped animation callback never strands the splash.
    const fallback = setTimeout(finish, TOTAL + 500);
    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [animate]);

  const arcProps = useAnimatedProps(() => ({ strokeDashoffset: arcOffset.value }));
  const stemProps = useAnimatedProps(() => ({ strokeDashoffset: stemOffset.value }));
  const leafLProps = useAnimatedProps(() => ({ opacity: leafL.value, scale: 0.2 + 0.8 * leafL.value }));
  const leafRProps = useAnimatedProps(() => ({ opacity: leafR.value, scale: 0.2 + 0.8 * leafR.value }));

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <AnimatedPath
        d="M13 32 A 19 19 0 0 0 51 32"
        stroke={Palette.ink}
        strokeWidth={3.6}
        strokeLinecap="round"
        strokeDasharray={ARC_LEN}
        animatedProps={arcProps}
      />
      <AnimatedPath
        d="M32 41 C 32 35 32 29 32 23"
        stroke={Palette.accent}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeDasharray={STEM_LEN}
        animatedProps={stemProps}
      />
      <AnimatedG originX={32} originY={29} animatedProps={leafLProps}>
        <Path d="M32 30.5 C 27 30.5 22 26.5 21.5 20.5 C 27 21.5 31 25 32 30.5 Z" fill={Palette.accent} />
      </AnimatedG>
      <AnimatedG originX={32} originY={29} animatedProps={leafRProps}>
        <Path d="M32 27 C 37 27 42 23.5 42.5 18 C 37 19 33 22.5 32 27 Z" fill={Palette.ink} />
      </AnimatedG>
    </Svg>
  );
}
