import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { AppColors } from '@/constants/colors';
import { s, vs, fs } from '@/constants/layout';
import { ToggleRow } from '@/components/settings/ToggleRow';
import { LinkRow } from '@/components/settings/LinkRow';
import { InfoRow } from '@/components/settings/InfoRow';

export default function SettingsScreen() {
  const [elderlyMode, setElderlyMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + vs(24) }]}
      >
        <View style={styles.card}>
          <ToggleRow label="Elderly Mode" value={elderlyMode} onToggle={() => setElderlyMode(!elderlyMode)} />
          <View style={styles.separator} />
          <ToggleRow label="High Contrast Mode" value={highContrast} onToggle={() => setHighContrast(!highContrast)} />
        </View>

        <View style={styles.card}>
          <LinkRow label="Language" />
        </View>

        <View style={styles.card}>
          <LinkRow label="Privacy Policy" />
          <View style={styles.separator} />
          <LinkRow label="Terms of Use" />
        </View>

        <View style={styles.card}>
          <InfoRow label="Version" value="1.0.0" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.backgroundGrouped },
  header: {
    paddingHorizontal: s(20),
    paddingTop: vs(24),
    paddingBottom: vs(16),
  },
  headerTitle: {
    fontSize: fs(28),
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: s(20),
  },
  card: {
    backgroundColor: AppColors.background,
    borderRadius: s(12),
    marginBottom: vs(16),
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: AppColors.border,
    marginLeft: s(16),
  },
});
