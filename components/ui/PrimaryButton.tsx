import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { AppColors } from '@/constants/colors';
import { s, vs, fs } from '@/constants/layout';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, disabled = false }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: s(10),
    paddingVertical: vs(15),
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: AppColors.primaryLight },
  buttonText: { fontSize: fs(16), fontWeight: '600', color: AppColors.background },
});
