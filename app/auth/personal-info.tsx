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

export default function PersonalInfoScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [myKad, setMyKad] = useState('');

  const isValid = name.trim() !== '' && myKad.trim() !== '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        <Text style={styles.step}>Step 3</Text>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>Please fill in all the fields provided.</Text>

        <Text style={styles.label}>Name: *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#AEAEB2"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>MyKAD: *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your MyKAD number"
          placeholderTextColor="#AEAEB2"
          keyboardType="number-pad"
          value={myKad}
          onChangeText={setMyKad}
        />

        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={() => router.push('/auth/scan-face')}
          disabled={!isValid}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Next</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  step: { fontSize: 13, color: '#8E8E93', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 28 },
  label: { fontSize: 13, color: '#1C1C1E', fontWeight: '500', marginBottom: 6 },
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
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#90CAF9' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  versionText: { fontSize: 12, color: '#8E8E93', textAlign: 'center', paddingBottom: 24 },
});