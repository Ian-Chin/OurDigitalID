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

export default function ScanFaceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#3A3A3C" />

      <View style={styles.container}>
        <Text style={styles.step}>Step 4</Text>
        <Text style={styles.title}>Please Hold Still</Text>

        {/* Face scan frame */}
        <View style={styles.scanWrapper}>
          <View style={styles.scanFrame}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <Text style={styles.scanLabel}>Scan face</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>OurDigitalID 1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#3A3A3C' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  step: { fontSize: 13, color: '#AEAEB2', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 40 },
  scanWrapper: { alignItems: 'center', marginBottom: 48 },
  scanFrame: {
    width: 180,
    height: 220,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#4CAF50',
    backgroundColor: '#4A4A4C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarIcon: { fontSize: 80 },
  scanLabel: { fontSize: 14, color: '#AEAEB2' },
  button: {
    width: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  versionText: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', paddingBottom: 24 },
});