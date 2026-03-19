import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

type Option = 'voice' | 'largetext' | 'autoscroll';

const OPTIONS: { key: Option; label: string; color: string; borderColor: string }[] = [
  { key: 'voice', label: 'Voice Assistance', color: '#EAF4FB', borderColor: '#90CAF9' },
  { key: 'largetext', label: 'Large text', color: '#FDEDED', borderColor: '#EF9A9A' },
  { key: 'autoscroll', label: 'Auto-scroll', color: '#FFFDE7', borderColor: '#FFE082' },
];

export default function SupportScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Option[]>([]);

  const toggle = (key: Option) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <Text style={styles.title}>Support Requirements</Text>

        {/* Person + Heart Icon */}
        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>🫀</Text>
        </View>

        {/* Options */}
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

        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push('/onboarding/showcase')}
          activeOpacity={0.8}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
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
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 28,
  },
  iconWrapper: { marginBottom: 28 },
  icon: { fontSize: 60 },
  optionsWrapper: { width: '100%', gap: 12, marginBottom: 20 },
  optionButton: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  optionSelected: { opacity: 0.6 },
  optionText: { fontSize: 16, fontWeight: '500', color: '#1C1C1E' },
  note: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  skipButton: {
    width: '60%',
    backgroundColor: '#D1D1D6',
    borderRadius: 25,
    paddingVertical: 13,
    alignItems: 'center',
  },
  skipText: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
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