import { FormInput } from '@/components/ui/FormInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { AppColors } from '@/constants/colors';
import { fs, s, vs } from '@/constants/layout';
import { useFadeInUp, useScaleIn, useFadeIn, stagger } from '@/hooks/useAnimations';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const stepAnim = useFadeIn(stagger(0, 100));
  const iconAnim = useScaleIn(stagger(1, 100));
  const inputAnim = useFadeInUp(stagger(2, 100));
  const btnAnim = useFadeInUp(stagger(3, 100));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

      <View style={styles.container}>
        <Animated.View style={stepAnim}>
          <Text style={styles.step}>Step 1</Text>
        </Animated.View>

        <Animated.View style={[styles.iconWrapper, iconAnim]}>
          <Text style={styles.icon}>📧</Text>
        </Animated.View>

        <Animated.View style={[{ width: '100%' }, inputAnim]}>
          <FormInput
            label="Email"
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </Animated.View>

        <Animated.View style={[{ width: '100%' }, btnAnim]}>
          <PrimaryButton
            label="Continue"
            onPress={() => router.replace('/home/Home')}
            disabled={!email}
          />
        </Animated.View>
      </View>

      <VersionFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(32),
    paddingTop: vs(60),
  },
  step: { fontSize: fs(13), color: AppColors.textSecondary, marginBottom: vs(20) },
  iconWrapper: { marginBottom: vs(32) },
  icon: { fontSize: fs(64) },
});
