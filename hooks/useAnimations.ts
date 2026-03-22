import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';

/**
 * Fade-in + slide-up entrance animation.
 * Each item in a staggered list gets a delay based on its index.
 */
export function useFadeInUp(delay = 0, duration = 500, translateY = 24) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [translateY, 0]) }],
  }));

  return animatedStyle;
}

/**
 * Simple fade-in animation.
 */
export function useFadeIn(delay = 0, duration = 400) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return animatedStyle;
}

/**
 * Scale-in with spring (for icons, emojis, avatars).
 */
export function useScaleIn(delay = 0) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 12, stiffness: 150, mass: 0.8 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
}

/**
 * Continuous pulse animation (for scan frames, loading indicators).
 */
export function usePulse(minScale = 0.97, maxScale = 1.03, duration = 1500) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(minScale, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
}

/**
 * Continuous glow/opacity pulse (for scan lines, active indicators).
 */
export function useGlowPulse(minOpacity = 0.4, maxOpacity = 1, duration = 2000) {
  const opacity = useSharedValue(maxOpacity);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(minOpacity, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(maxOpacity, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return animatedStyle;
}

/**
 * Press scale animation for buttons.
 * Returns [animatedStyle, onPressIn, onPressOut].
 */
export function usePressScale(activeScale = 0.96) {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(activeScale, { damping: 15, stiffness: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}

/**
 * Slide-in from left animation.
 */
export function useSlideInLeft(delay = 0, duration = 450, translateX = -30) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: interpolate(progress.value, [0, 1], [translateX, 0]) }],
  }));

  return animatedStyle;
}

/** Stagger delay helper */
export const stagger = (index: number, baseDelay = 80) => index * baseDelay;
