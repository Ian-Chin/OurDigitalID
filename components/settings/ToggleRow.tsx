import React from 'react';
import { View, Switch, StyleSheet } from 'react-native';
import { s, vs } from '@/constants/layout';
import { useAppContext } from '@/context/AppContext';
import { AppText } from '@/components/common/AppText';

export interface ToggleRowProps {
  label: string;
  value: boolean;
  onToggle: () => void;
}

export function ToggleRow({ label, value, onToggle }: ToggleRowProps) {
  const { colors } = useAppContext();

  return (
    <View style={styles.row}>
      <AppText size={16}>{label}</AppText>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.background}
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
});