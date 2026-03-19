import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { AppColors } from '@/constants/colors';
import { fs, s, vs } from '@/constants/layout';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanFaceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={AppColors.backgroundDark} />

      <View style={styles.container}>
        <Text style={styles.step}>Step 4</Text>
        <Text style={styles.title}>Please Hold Still</Text>

        <View style={styles.scanWrapper}>
          <View style={styles.scanFrame}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.scanLabel}>Scan face</Text>
        </View>

        <PrimaryButton
          label="Continue"
          onPress={() => router.replace('/home')}
        />
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
  },
  avatarIcon: { fontSize: fs(80) },
  scanLabel: { fontSize: fs(14), color: AppColors.textPlaceholder },
});
