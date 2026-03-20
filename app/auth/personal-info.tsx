import { FormInput } from '@/components/ui/FormInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { AppColors } from '@/constants/colors';
import { fs, s, vs } from '@/constants/layout';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [myKad, setMyKad] = useState('');

  const isValid = name.trim() !== '' && myKad.trim() !== '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />

      <View style={styles.container}>
        <Text style={styles.step}>Step 3</Text>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>Please fill in all the fields provided.</Text>

        <FormInput
          label="Name"
          required
          placeholder="Enter your full name"
          value={name}
          onChangeText={setName}
        />

        <FormInput
          label="MyKAD"
          required
          placeholder="Enter your MyKAD number"
          keyboardType="number-pad"
          value={myKad}
          onChangeText={setMyKad}
        />

        <PrimaryButton
          label="Next"
          onPress={() => router.push('/auth/scan-face')}
          disabled={!isValid}
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
    justifyContent: 'center',
    paddingHorizontal: s(32),
    paddingTop: vs(60),
  },
  step: { fontSize: fs(13), color: AppColors.textSecondary, marginBottom: vs(12) },
  title: { fontSize: fs(22), fontWeight: '700', color: AppColors.textPrimary, marginBottom: vs(6) },
  subtitle: { fontSize: fs(13), color: AppColors.textSecondary, marginBottom: vs(28) },
});
