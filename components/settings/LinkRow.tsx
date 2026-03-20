import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s, vs } from '@/constants/layout';
import { useAppContext } from '@/context/AppContext';
import { AppText } from '@/components/common/AppText';

export interface LinkRowProps {
  label: string;
  onPress?: () => void;
}

export function LinkRow({ label, onPress }: LinkRowProps) {
  const { colors } = useAppContext();

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.6} onPress={onPress}>
      <AppText size={16}>{label}</AppText>
      <Ionicons name="chevron-forward" size={s(20)} color={colors.separator} />
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
});