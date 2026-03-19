import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

type Language = 'en' | 'ms';

export default function LanguageScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Language>('en');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/onboarding/support')}
          activeOpacity={0.85}
        >
          <Text style={styles.continueButtonText}>
            {selected === 'en' ? 'Continue' : 'Teruskan'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSelected((prev) => (prev === 'en' ? 'ms' : 'en'))}
          style={styles.toggleWrapper}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleText}>
            {selected === 'en' ? 'Change to Bahasa Melayu' : 'Change to English'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.versionText}>OurDigitalID 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  languageIcon: { width: 72, height: 72 },
  continueButton: {
    width: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  toggleWrapper: { paddingVertical: 8 },
  toggleText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: { alignItems: 'center', paddingBottom: 24, gap: 12 },
  dotsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D1D6',
    borderWidth: 1,
    borderColor: '#C7C7CC',
  },
  dotActive: {
    width: 28,
    borderRadius: 5,
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E',
  },
  versionText: { fontSize: 12, color: '#8E8E93' },
});