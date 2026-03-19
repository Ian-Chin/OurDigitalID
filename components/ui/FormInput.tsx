import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { AppColors } from '@/constants/colors';
import { s, vs, fs } from '@/constants/layout';

interface FormInputProps extends TextInputProps {
  label: string;
  required?: boolean;
}

export function FormInput({ label, required = false, style, ...inputProps }: FormInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}{required ? ' *' : ''}
      </Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={AppColors.textPlaceholder}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginBottom: vs(20) },
  label: {
    fontSize: fs(13),
    color: AppColors.textPrimary,
    fontWeight: '500',
    marginBottom: vs(6),
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: s(8),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    fontSize: fs(14),
    color: AppColors.textPrimary,
  },
});
