import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppColors } from '@/constants/colors';
import { s } from '@/constants/layout';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i === currentStep && styles.dotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: { flexDirection: 'row', gap: s(8), alignItems: 'center' },
  dot: {
    width: s(10),
    height: s(10),
    borderRadius: s(5),
    backgroundColor: AppColors.border,
    borderWidth: 1,
    borderColor: AppColors.separator,
  },
  dotActive: {
    width: s(28),
    borderRadius: s(5),
    backgroundColor: AppColors.textPrimary,
    borderColor: AppColors.textPrimary,
  },
});
