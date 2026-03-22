import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { s, vs } from '@/constants/layout';
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
// [ADDED]
import { useTranslation } from 'react-i18next';
import { useAppContext } from '@/context/AppContext';
import { AppText } from '@/components/common/AppText';

// [ADDED] all 3 language options
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'cn', label: '中文' },
];

export default function LanguageScreen() {
  const router = useRouter();
  // [CHANGED] use context instead of local useState
  const { language, setLanguage, colors } = useAppContext();
  // [ADDED] i18n translation hook
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.container}>
        {/* [CHANGED] Text → AppText, hardcoded → t() */}
        <AppText size={24} style={{ fontWeight: '600', textAlign: 'center', marginBottom: vs(24) }}>
          {t('chooseLanguage')}
        </AppText>

        <View style={[styles.iconWrapper, { borderColor: colors.textPrimary }]}>
          <Image
            source={require('@/assets/images/language.png')}
            style={styles.languageIcon}
            resizeMode="contain"
          />
        </View>

        {/* [ADDED] 3 language buttons */}
        <View style={styles.toggleContainer}>
          {LANGUAGE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => setLanguage(option.value as any)}
              activeOpacity={0.7}
              style={[
                styles.langButton,
                {
                  backgroundColor: language === option.value
                    ? colors.primary
                    : colors.backgroundGrouped,
                  borderColor: language === option.value
                    ? colors.primary
                    : colors.border,
                }
              ]}
            >
              <AppText
                size={14}
                style={{
                  fontWeight: '600',
                  color: language === option.value ? '#FFFFFF' : colors.textPrimary,
                }}
              >
                {option.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonWrapper}>
          {/* [CHANGED] hardcoded → t() */}
          <PrimaryButton
            label={t('continue')}
            onPress={() => router.push('/onboarding/support')}
          />
        </View>

        <View style={styles.footer}>
          <StepIndicator totalSteps={3} currentStep={0} />
          <VersionFooter />
        </View>
      </View>
    </SafeAreaView>
  );
}

// [NOTE] StyleSheet unchanged — colors applied inline above
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(32),
    paddingTop: vs(60),
  },
  iconWrapper: {
    width: s(130),
    height: s(130),
    borderRadius: s(65),
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(32),
  },
  languageIcon: { width: s(72), height: s(72) },
  // [ADDED]
  toggleContainer: {
    flexDirection: 'row',
    gap: s(10),
    marginBottom: vs(32),
  },
  langButton: {
    paddingVertical: vs(10),
    paddingHorizontal: s(16),
    borderRadius: s(8),
    borderWidth: 1,
  },
  buttonWrapper: { width: '100%', marginBottom: vs(16) },
  footer: { alignItems: 'center', marginTop: vs(48), gap: vs(12) },
});