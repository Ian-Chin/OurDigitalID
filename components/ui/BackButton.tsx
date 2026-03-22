import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppColors } from '@/constants/colors';
import { s, vs } from '@/constants/layout';
import { useFadeIn } from '@/hooks/useAnimations';

interface BackButtonProps {
  onPress?: () => void;
}

export function BackButton({ onPress }: BackButtonProps) {
  const router = useRouter();
  const fadeAnim = useFadeIn(100, 300);

  return (
    <Animated.View style={[styles.backButton, fadeAnim]}>
      <TouchableOpacity
        onPress={onPress ?? (() => router.back())}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={s(24)} color={AppColors.textPrimary} />
      </TouchableOpacity>
    </Animated.View>
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
