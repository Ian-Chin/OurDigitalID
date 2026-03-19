import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function ShowcaseScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* Logo placeholder */}
        <View style={styles.logoWrapper}>
          <Text style={styles.logoText}>logo</Text>
        </View>

        <Text style={styles.title}>Your Smarter Digital Identity</Text>

        {/* Bullet points */}
        <View style={styles.bulletWrapper}>
          {[
            'Secure AI Identity Verification',
            'Integrated Public & Healthcare Services',
            'One Identity for All Government Platforms',
          ].map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Create Digital ID */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/auth/email')}
          activeOpacity={0.85}
        >
          <Text style={styles.createButtonText}>Create Digital ID</Text>
        </TouchableOpacity>

        {/* Log In */}
        <TouchableOpacity
          onPress={() => router.push('/auth/email')}
          activeOpacity={0.7}
          style={styles.loginWrapper}
        >
          <Text style={styles.loginText}>Log In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
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
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  logoText: { fontSize: 16, color: '#8E8E93' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 24,
  },
  bulletWrapper: { width: '100%', marginBottom: 36, gap: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { fontSize: 14, color: '#1C1C1E', marginTop: 1 },
  bulletText: { fontSize: 14, color: '#1C1C1E', flex: 1, lineHeight: 20 },
  createButton: {
    width: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  loginWrapper: { paddingVertical: 8 },
  loginText: { fontSize: 14, color: '#1C1C1E', fontWeight: '500' },
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