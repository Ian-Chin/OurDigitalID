import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { AppColors } from '@/constants/colors';
import { fs, s, vs } from '@/constants/layout';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Language = 'en' | 'ms';

export default function LanguageScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Language>('en');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

      <View style={styles.container}>
        <Text style={styles.title}>
          {selected === 'en' ? 'Choose your Language' : 'Pilih Bahasa Anda'}
        </Text>

        <View style={styles.iconWrapper}>
          <Image
            source={require('@/assets/images/language.png')}
            style={styles.languageIcon}
            resizeMode="contain"
          />
        </View>

        <View style={styles.buttonWrapper}>
          <PrimaryButton
            label={selected === 'en' ? 'Continue' : 'Teruskan'}
            onPress={() => router.push('/onboarding/support')}
          />
        </View>

        <TouchableOpacity
          onPress={() => setSelected((prev) => (prev === 'en' ? 'ms' : 'en'))}
          style={styles.toggleWrapper}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleText}>
            {selected === 'en' ? 'Change to Bahasa Melayu' : 'Change to English'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <StepIndicator totalSteps={3} currentStep={0} />
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
  title: {
    fontSize: fs(24),
    fontWeight: '600',
    color: AppColors.textPrimary,
    textAlign: 'center',
    marginBottom: vs(24),
  },
  iconWrapper: {
    width: s(130),
    height: s(130),
    borderRadius: s(65),
    borderWidth: 2,
    borderColor: AppColors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(40),
  },
  languageIcon: { width: s(72), height: s(72) },
  buttonWrapper: { width: '100%', marginBottom: vs(16) },
  toggleWrapper: { paddingVertical: vs(8) },
  toggleText: {
    fontSize: fs(14),
    color: AppColors.textPrimary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: { alignItems: 'center', marginTop: vs(48), gap: vs(12) },
});
