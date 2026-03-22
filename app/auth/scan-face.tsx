import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { AppColors } from '@/constants/colors';
import { fs, s, vs } from '@/constants/layout';
import { useFadeInUp, useFadeIn, useScaleIn, usePulse, useGlowPulse, stagger } from '@/hooks/useAnimations';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanFaceScreen() {
  const router = useRouter();

  // Entrance animations
  const stepAnim = useFadeIn(stagger(0, 120));
  const titleAnim = useFadeInUp(stagger(1, 120));
  const frameAnim = useScaleIn(stagger(2, 120));
  const btnAnim = useFadeInUp(stagger(4, 120));

  // Continuous scan effects
  const framePulse = usePulse(0.98, 1.02, 2000);
  const borderGlow = useGlowPulse(0.5, 1, 2500);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.backgroundDark} />

      <View style={styles.container}>
        <Animated.View style={stepAnim}>
          <Text style={styles.step}>Step 4</Text>
        </Animated.View>

        <Animated.View style={titleAnim}>
          <Text style={styles.title}>Please Hold Still</Text>
        </Animated.View>

        <Animated.View style={[styles.scanWrapper, frameAnim]}>
          <Animated.View style={[styles.scanFrame, framePulse]}>
            <Animated.View style={borderGlow}>
              <View style={styles.scanBorderOverlay} />
            </Animated.View>
            <Text style={styles.avatarIcon}>👤</Text>
          </Animated.View>
          <Animated.View style={borderGlow}>
            <Text style={styles.scanLabel}>Scan face</Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[{ width: '100%' }, btnAnim]}>
          <PrimaryButton
            label="Continue"
            onPress={() => router.replace('/home/Home')}
          />
        </Animated.View>
      </View>

      <VersionFooter color={AppColors.textMuted} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.backgroundDark },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(32),
    paddingTop: vs(60),
  },
  step: { fontSize: fs(13), color: AppColors.textPlaceholder, marginBottom: vs(12) },
  title: { fontSize: fs(22), fontWeight: '700', color: AppColors.background, marginBottom: vs(40) },
  scanWrapper: { alignItems: 'center', marginBottom: vs(48) },
  scanFrame: {
    width: s(180),
    height: vs(220),
    borderRadius: s(16),
    borderWidth: 3,
    borderColor: AppColors.success,
    backgroundColor: AppColors.backgroundDarkAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(16),
    overflow: 'hidden',
  },
  scanBorderOverlay: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: s(16),
    borderWidth: 3,
    borderColor: AppColors.success,
  },
  avatarIcon: { fontSize: fs(80) },
  scanLabel: { fontSize: fs(14), color: AppColors.textPlaceholder },
});
