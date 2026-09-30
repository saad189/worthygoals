import { useReducedMotion } from 'react-native-reanimated';

type Slide = 'slide_from_right' | 'slide_from_left' | 'slide_from_bottom';

/**
 * A native-stack slide, or no transition when the OS asks for reduced motion
 * (WCAG 2.3.3). Reanimated animations (sheets, Moti, reaction cards) already
 * follow the system setting by default; native stack transitions and React
 * Native's core Animated do not, which is what this covers.
 */
export function useSlide() {
  const reduce = useReducedMotion();
  return (animation: Slide) => (reduce ? ('none' as const) : animation);
}

export { useReducedMotion };
