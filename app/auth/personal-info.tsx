import { FormInput } from '@/components/ui/FormInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { AppColors } from '@/constants/colors';
import { fs, s, vs } from '@/constants/layout';
import { useFadeInUp, useFadeIn, stagger } from '@/hooks/useAnimations';
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

export default function PersonalInfoScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [myKad, setMyKad] = useState('');

  const isValid = name.trim() !== '' && myKad.trim() !== '';

  // Entrance animations
  const stepAnim = useFadeIn(stagger(0, 100));
  const titleAnim = useFadeInUp(stagger(1, 100));
  const input1Anim = useFadeInUp(stagger(2, 100));
  const input2Anim = useFadeInUp(stagger(3, 100));
  const btnAnim = useFadeInUp(stagger(4, 100));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

      <View style={styles.container}>
        <Animated.View style={stepAnim}>
          <Text style={styles.step}>Step 3</Text>
        </Animated.View>

        <Animated.View style={titleAnim}>
          <Text style={styles.title}>Personal Information</Text>
          <Text style={styles.subtitle}>Please fill in all the fields provided.</Text>
        </Animated.View>

        <Animated.View style={[{ width: '100%' }, input1Anim]}>
          <FormInput
            label="Name"
            required
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />
        </Animated.View>

        <Animated.View style={[{ width: '100%' }, input2Anim]}>
          <FormInput
            label="MyKAD"
            required
            placeholder="Enter your MyKAD number"
            keyboardType="number-pad"
            value={myKad}
            onChangeText={setMyKad}
          />
        </Animated.View>

        <Animated.View style={[{ width: '100%' }, btnAnim]}>
          <PrimaryButton
            label="Next"
            onPress={() => router.push('/auth/scan-face')}
            disabled={!isValid}
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
    justifyContent: 'center',
    paddingHorizontal: s(32),
    paddingTop: vs(60),
  },
  step: { fontSize: fs(13), color: AppColors.textSecondary, marginBottom: vs(12) },
  title: { fontSize: fs(22), fontWeight: '700', color: AppColors.textPrimary, marginBottom: vs(6) },
  subtitle: { fontSize: fs(13), color: AppColors.textSecondary, marginBottom: vs(28) },
});
