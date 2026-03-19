import { BackButton } from '@/components/ui/BackButton';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { AppColors } from '@/constants/colors';
import { fs, s, vs } from '@/constants/layout';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SupportOption = 'voice' | 'largetext' | 'autoscroll';

interface SupportOptionConfig {
  key: SupportOption;
  label: string;
  color: string;
  borderColor: string;
}

const OPTIONS: SupportOptionConfig[] = [
  { key: 'voice', label: 'Voice Assistance', color: AppColors.supportVoiceBg, borderColor: AppColors.supportVoiceBorder },
  { key: 'largetext', label: 'Large text', color: AppColors.supportLargeTextBg, borderColor: AppColors.supportLargeTextBorder },
  { key: 'autoscroll', label: 'Auto-scroll', color: AppColors.supportAutoScrollBg, borderColor: AppColors.supportAutoScrollBorder },
];

export default function SupportScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<SupportOption[]>([]);

  const toggle = (key: SupportOption) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

      <BackButton />

      <View style={styles.container}>
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>🫀</Text>
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
              <Text style={styles.optionText}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.note}>
          This section helps us support users with disabilities. Skip if not applicable.
        </Text>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push('/onboarding/showcase')}
          activeOpacity={0.8}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <StepIndicator totalSteps={3} currentStep={1} />
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
  iconWrapper: { marginBottom: vs(28) },
  icon: { fontSize: fs(60) },
  optionsWrapper: { width: '100%', gap: vs(12), marginBottom: vs(20) },
  optionButton: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: s(10),
    paddingVertical: vs(14),
    alignItems: 'center',
  },
  optionSelected: { opacity: 0.6 },
  optionText: { fontSize: fs(16), fontWeight: '500', color: AppColors.textPrimary },
  note: {
    fontSize: fs(12),
    color: AppColors.textMuted,
    textAlign: 'center',
    lineHeight: fs(18),
    marginBottom: vs(24),
    paddingHorizontal: s(8),
  },
  skipButton: {
    width: '60%',
    backgroundColor: AppColors.border,
    borderRadius: s(25),
    paddingVertical: vs(13),
    alignItems: 'center',
  },
  skipText: { fontSize: fs(15), fontWeight: '600', color: AppColors.textPrimary },
  footer: { alignItems: 'center', marginTop: vs(48), gap: vs(12) },
});
