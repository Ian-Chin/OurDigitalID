import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function EmailScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <Text style={styles.step}>Step 1</Text>

        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>📧</Text>
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          placeholderTextColor="#AEAEB2"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity
          style={[styles.button, !email && styles.buttonDisabled]}
          onPress={() => router.push('/auth/otp')}
          disabled={!email}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Send OTP Code</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.versionText}>OurDigitalID 1.0.0</Text>
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
  step: { fontSize: 13, color: '#8E8E93', marginBottom: 20 },
  iconWrapper: { marginBottom: 32 },
  icon: { fontSize: 64 },
  label: { alignSelf: 'flex-start', fontSize: 14, color: '#1C1C1E', marginBottom: 8 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#90CAF9' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  versionText: { fontSize: 12, color: '#8E8E93', textAlign: 'center', paddingBottom: 24 },
});