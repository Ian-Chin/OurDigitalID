import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/colors';
import { s, vs, fs } from '@/constants/layout';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.spacer} />
        <TouchableOpacity style={styles.notifButton} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={s(22)} color={AppColors.textPrimary} />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>Welcome to OurDigitalID</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(20),
    paddingTop: vs(24),
  },
  spacer: { flex: 1 },
  notifButton: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    backgroundColor: AppColors.notifButtonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: s(10),
    right: s(11),
    width: s(9),
    height: s(9),
    borderRadius: s(5),
    backgroundColor: AppColors.notifBadge,
    borderWidth: 1.5,
    borderColor: AppColors.notifButtonBg,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fs(24), fontWeight: '700', color: AppColors.textPrimary, marginBottom: vs(8) },
  subtitle: { fontSize: fs(15), color: AppColors.textSecondary },
});
