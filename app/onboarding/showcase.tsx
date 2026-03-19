import { BackButton } from '@/components/ui/BackButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { AppColors } from '@/constants/colors';
import { fs, s, vs } from '@/constants/layout';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES = [
  'Secure AI Identity Verification',
  'Integrated Public & Healthcare Services',
  'One Identity for All Government Platforms',
];

export default function ShowcaseScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

      <BackButton />

      <View style={styles.container}>
        <Image
          source={require('../../assets/images/id_illustration.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Your Smarter Digital Identity</Text>

        <View style={styles.bulletWrapper}>
          {FEATURES.map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.buttonWrapper}>
          <PrimaryButton
            label="Create Digital ID"
            onPress={() => router.push('/auth/email')}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push('/auth/email')}
          activeOpacity={0.7}
          style={styles.loginWrapper}
        >
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <StepIndicator totalSteps={3} currentStep={2} />
          <VersionFooter />
        </View>
      </View>
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
  logo: {
    width: s(200),
    height: s(200),
    marginBottom: vs(20),
  },
  title: {
    fontSize: fs(22),
    fontWeight: '700',
    color: AppColors.textPrimary,
    textAlign: 'center',
    marginBottom: vs(16),
  },
  bulletWrapper: { width: '100%', marginBottom: vs(28), gap: vs(10) },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: s(8) },
  bullet: { fontSize: fs(14), color: AppColors.textPrimary, marginTop: vs(1) },
  bulletText: { fontSize: fs(14), color: AppColors.textPrimary, flex: 1, lineHeight: fs(20) },
  buttonWrapper: { width: '100%', marginBottom: vs(16) },
  loginWrapper: { paddingVertical: vs(8) },
  loginText: { fontSize: fs(14), color: AppColors.textPrimary, fontWeight: '500' },
  footer: { alignItems: 'center', marginTop: vs(48), gap: vs(12) },
});
