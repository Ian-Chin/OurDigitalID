import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { AppColors } from '@/constants/colors';
import { s, vs, fs } from '@/constants/layout';

export interface ToggleRowProps {
  label: string;
  value: boolean;
  onToggle: () => void;
}

export function ToggleRow({ label, value, onToggle }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: AppColors.border, true: AppColors.primary }}
        thumbColor={AppColors.background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
  },
  rowLabel: {
    fontSize: fs(16),
    color: AppColors.textPrimary,
  },
});
