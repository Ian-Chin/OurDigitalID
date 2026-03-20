import React from 'react';
import { View, StyleSheet } from 'react-native';
import { s, vs } from '@/constants/layout';
import { AppText } from '@/components/common/AppText';
import { useAppContext } from '@/context/AppContext';

export interface InfoRowProps {
  label: string;
  value: string;
}

export function InfoRow({ label, value }: InfoRowProps) {
  const { colors } = useAppContext();

  return (
    <View style={styles.row}>
      <AppText size={16}>{label}</AppText>
      <AppText size={16} style={{ color: colors.textSecondary }}>{value}</AppText>
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
});