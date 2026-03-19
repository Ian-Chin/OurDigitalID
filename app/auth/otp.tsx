import React, { useState, useRef } from 'react';
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

export default function OtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleBackspace = (text: string, index: number) => {
    if (!text && index > 0) inputs.current[index - 1]?.focus();
  };

  const isFilled = otp.every((d) => d !== '');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <Text style={styles.step}>Step 2</Text>

        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>🔐</Text>
        </View>

        <Text style={styles.title}>Enter 6 digit code</Text>
        <Text style={styles.subtitle}>OTP sent to p***g@gmail.com</Text>

        {/* OTP boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => (inputs.current[i] = ref)}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              maxLength={1}
              keyboardType="number-pad"
              value={digit}
              onChangeText={(text) => handleChange(text, i)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') handleBackspace(digit, i);
              }}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.resendWrapper} activeOpacity={0.7}>
          <Text style={styles.resendText}>Resend Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !isFilled && styles.buttonDisabled]}
          onPress={() => router.push('/auth/personal-info')}
          disabled={!isFilled}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Verify</Text>
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
  iconWrapper: { marginBottom: 24 },
  icon: { fontSize: 64 },
  title: { fontSize: 20, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 28 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  otpBox: {
    width: 44,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  otpBoxFilled: { borderColor: '#2196F3' },
  resendWrapper: { marginBottom: 28 },
  resendText: { fontSize: 13, color: '#2196F3', fontWeight: '500' },
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