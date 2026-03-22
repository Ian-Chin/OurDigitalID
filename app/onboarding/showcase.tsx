import { BackButton } from '@/components/ui/BackButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { s, vs } from '@/constants/layout'; // ← keep s and vs, remove fs
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';
import { AppText } from '@/components/common/AppText';

export default function ShowcaseScreen() {
  const router = useRouter();
  const { colors } = useAppContext();
  const { t } = useTranslation();

  // ← FEATURES now uses t()
  const FEATURES = [
    t('showcaseFeature1'),
    t('showcaseFeature2'),
    t('showcaseFeature3'),
  ];

  return (
    // ← colors.background instead of AppColors
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <BackButton />

      <View style={styles.container}>
        <Image
          source={require('../../assets/images/id_illustration.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* ← AppText + t() */}
        <AppText size={22} style={{ fontWeight: '700', textAlign: 'center', marginBottom: vs(16) }}>
          {t('showcaseTitle')}
        </AppText>

        <View style={styles.bulletWrapper}>
          {FEATURES.map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              {/* ← AppText */}
              <AppText size={14} style={{ marginTop: vs(1) }}>•</AppText>
              <AppText size={14} style={{ flex: 1, lineHeight: 20 }}>{item}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.buttonWrapper}>
          {/* ← t() */}
          <PrimaryButton
            label={t('createDigitalId')}
            onPress={() => router.push('/auth/email')}
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push('/auth/email')}
          activeOpacity={0.7}
          style={styles.loginWrapper}
        >
          {/* ← AppText + t() */}
          <AppText size={14} style={{ fontWeight: '500' }}>{t('login')}</AppText>
        </TouchableOpacity>

        <View style={styles.footer}>
          <StepIndicator totalSteps={3} currentStep={2} />
          <VersionFooter />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ← removed AppColors and fs from StyleSheet
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
  bulletWrapper: { width: '100%', marginBottom: vs(28), gap: vs(10) },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: s(8) },
  buttonWrapper: { width: '100%', marginBottom: vs(16) },
  loginWrapper: { paddingVertical: vs(8) },
  footer: { alignItems: 'center', marginTop: vs(48), gap: vs(12) },
});