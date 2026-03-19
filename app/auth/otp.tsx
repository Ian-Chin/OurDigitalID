import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { AppColors } from '@/constants/colors';
import { fs, s, vs } from '@/constants/layout';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleBackspace = (text: string, index: number) => {
    if (!text && index > 0) inputs.current[index - 1]?.focus();
  };

  const isFilled = otp.every((d) => d !== '');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

      <View style={styles.container}>
        <Text style={styles.step}>Step 2</Text>

        <View style={styles.iconWrapper}>
          <Text style={styles.icon}>🔐</Text>
        </View>

        <Text style={styles.title}>Enter 6 digit code</Text>
        <Text style={styles.subtitle}>OTP sent to p***g@gmail.com</Text>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputs.current[i] = ref; }}
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

        <PrimaryButton
          label="Verify"
          onPress={() => router.push('/auth/personal-info')}
          disabled={!isFilled}
        />
      </View>

      <VersionFooter />
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
  step: { fontSize: fs(13), color: AppColors.textSecondary, marginBottom: vs(20) },
  iconWrapper: { marginBottom: vs(24) },
  icon: { fontSize: fs(64) },
  title: { fontSize: fs(20), fontWeight: '600', color: AppColors.textPrimary, marginBottom: vs(8) },
  subtitle: { fontSize: fs(13), color: AppColors.textSecondary, marginBottom: vs(28) },
  otpRow: { flexDirection: 'row', gap: s(10), marginBottom: vs(16) },
  otpBox: {
    width: s(44),
    height: vs(52),
    borderWidth: 1.5,
    borderColor: AppColors.border,
    borderRadius: s(8),
    textAlign: 'center',
    fontSize: fs(20),
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  otpBoxFilled: { borderColor: AppColors.primary },
  resendWrapper: { marginBottom: vs(28) },
  resendText: { fontSize: fs(13), color: AppColors.primary, fontWeight: '500' },
});
