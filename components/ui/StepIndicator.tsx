import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AppColors } from '@/constants/colors';
import { s } from '@/constants/layout';

// Pre-compute scaled values outside the worklet
const DOT_ACTIVE_WIDTH = s(28);
const DOT_INACTIVE_WIDTH = s(10);

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

function AnimatedDot({ isActive }: { isActive: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(isActive ? DOT_ACTIVE_WIDTH : DOT_INACTIVE_WIDTH, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    }),
    backgroundColor: withTiming(
      isActive ? AppColors.textPrimary : AppColors.border,
      { duration: 300 }
    ),
    borderColor: withTiming(
      isActive ? AppColors.textPrimary : AppColors.separator,
      { duration: 300 }
    ),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <AnimatedDot key={i} isActive={i === currentStep} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: { flexDirection: 'row', gap: s(8), alignItems: 'center' },
  dot: {
    height: s(10),
    borderRadius: s(5),
    borderWidth: 1,
  },
});
