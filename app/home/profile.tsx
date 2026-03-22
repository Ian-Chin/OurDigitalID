import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '@/constants/colors';
import { vs, fs } from '@/constants/layout';
import { useFadeInUp, stagger } from '@/hooks/useAnimations';

export default function ProfileScreen() {
  const titleAnim = useFadeInUp(stagger(0, 120));
  const subtitleAnim = useFadeInUp(stagger(1, 120));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={titleAnim}>
          <Text style={styles.title}>Profile</Text>
        </Animated.View>
        <Animated.View style={subtitleAnim}>
          <Text style={styles.subtitle}>Your profile details</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fs(24), fontWeight: '700', color: AppColors.textPrimary, marginBottom: vs(8) },
  subtitle: { fontSize: fs(15), color: AppColors.textSecondary },
});
