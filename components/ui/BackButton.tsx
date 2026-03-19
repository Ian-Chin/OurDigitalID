import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/colors';
import { s, vs } from '@/constants/layout';

interface BackButtonProps {
  onPress?: () => void;
}

export function BackButton({ onPress }: BackButtonProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={onPress ?? (() => router.back())}
      activeOpacity={0.7}
    >
      <Ionicons name="chevron-back" size={s(24)} color={AppColors.textPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: vs(50),
    left: s(16),
    zIndex: 10,
    padding: s(8),
  },
});
