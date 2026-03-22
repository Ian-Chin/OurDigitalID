import { BackButton } from '@/components/ui/BackButton';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { s, vs } from '@/constants/layout';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

type SupportOption = 'voice' | 'largetext' | 'autoscroll';

interface SupportOptionConfig {
  key: SupportOption;
  // [CHANGED] label is now a translation key
  labelKey: string;
  color: string;
  borderColor: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<SupportOption[]>([]);
  // [ADDED]
  const { colors } = useAppContext();
  const { t } = useTranslation();

  // [CHANGED] OPTIONS moved inside component — uses colors from context
  const OPTIONS: SupportOptionConfig[] = [
    { key: 'voice', labelKey: 'voiceAssistance', color: colors.supportVoiceBg, borderColor: colors.supportVoiceBorder },
    { key: 'largetext', labelKey: 'largeText', color: colors.supportLargeTextBg, borderColor: colors.supportLargeTextBorder },
    { key: 'autoscroll', labelKey: 'autoScroll', color: colors.supportAutoScrollBg, borderColor: colors.supportAutoScrollBorder },
  ];

  const toggle = (key: SupportOption) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    // [CHANGED] AppColors → colors
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <BackButton />

      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          {/* [CHANGED] Text → AppText for emoji */}
          <AppText size={60}>🫀</AppText>
        </View>

        <View style={styles.optionsWrapper}>
          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.optionButton,
                { backgroundColor: opt.color, borderColor: opt.borderColor },
                selected.includes(opt.key) && styles.optionSelected,
              ]}
              onPress={() => toggle(opt.key)}
              activeOpacity={0.8}
            >
              {/* [CHANGED] Text → AppText, label → t(labelKey) */}
              <AppText size={16} style={{ fontWeight: '500', color: colors.textPrimary }}>
                {t(opt.labelKey)}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* [CHANGED] Text → AppText, hardcoded → t() */}
        <AppText size={12} style={{
          color: colors.textMuted,
          textAlign: 'center',
          lineHeight: 18,
          marginBottom: vs(24),
          paddingHorizontal: s(8),
        }}>
          {t('supportNote')}
        </AppText>

        <TouchableOpacity
          style={[styles.skipButton, { backgroundColor: colors.border }]}
          onPress={() => router.push('/onboarding/showcase')}
          activeOpacity={0.8}
        >
          {/* [CHANGED] Text → AppText, hardcoded → t() */}
          <AppText size={15} style={{ fontWeight: '600', color: colors.textPrimary }}>
            {t('skip')}
          </AppText>
        </TouchableOpacity>

        <View style={styles.footer}>
          <StepIndicator totalSteps={3} currentStep={1} />
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
  iconWrapper: { marginBottom: vs(28) },
  optionsWrapper: { width: '100%', gap: vs(12), marginBottom: vs(20) },
  optionButton: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: s(10),
    paddingVertical: vs(14),
    alignItems: 'center',
  },
  optionSelected: { opacity: 0.6 },
  skipButton: {
    width: '60%',
    borderRadius: s(25),
    paddingVertical: vs(13),
    alignItems: 'center',
  },
  footer: { alignItems: 'center', marginTop: vs(48), gap: vs(12) },
});