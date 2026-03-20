import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/colors';
import { s, vs, fs } from '@/constants/layout';

export interface LinkRowProps {
  label: string;
  onPress?: () => void;
}

export function LinkRow({ label, onPress }: LinkRowProps) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.6} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={s(20)} color={AppColors.separator} />
    </TouchableOpacity>
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
