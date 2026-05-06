import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { AppColors } from '@/constants/colors';
import { s, vs, fs } from '@/constants/layout';

interface FormInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
}

export function FormInput({ label, required = false, error, style, ...inputProps }: FormInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {label}{required ? ' *' : ''}
      </Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : undefined, style]}
        placeholderTextColor={AppColors.textPlaceholder}
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', marginBottom: vs(18) },
  label: {
    fontSize: fs(11),
    color: AppColors.textSecondary,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: vs(8),
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: AppColors.borderLight,
    backgroundColor: AppColors.backgroundElevated,
    borderRadius: s(14),
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    fontSize: fs(15),
    color: AppColors.textPrimary,
    fontWeight: '500',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: fs(12),
    color: '#EF4444',
    marginTop: vs(6),
    fontWeight: '600',
  },
});
