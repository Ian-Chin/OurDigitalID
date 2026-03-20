import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { s, vs } from '@/constants/layout';
import { useAppContext } from '@/context/AppContext';
import { AppText } from '@/components/common/AppText';
import { ToggleRow } from '@/components/settings/ToggleRow';
import { LinkRow } from '@/components/settings/LinkRow';
import { InfoRow } from '@/components/settings/InfoRow';

export default function SettingsScreen() {
  const { elderlyMode, setElderlyMode, colors } = useAppContext();
  const [highContrast, setHighContrast] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundGrouped }]}>
      <View style={styles.header}>
        <AppText size={28} style={{ fontWeight: '700' }}>Settings</AppText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + vs(24) }]}
      >
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <ToggleRow label="Elderly Mode" value={elderlyMode} onToggle={() => setElderlyMode(!elderlyMode)} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <ToggleRow label="High Contrast Mode" value={highContrast} onToggle={() => setHighContrast(!highContrast)} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <LinkRow label="Language" />
        </View>

        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <LinkRow label="Privacy Policy" />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <LinkRow label="Terms of Use" />
        </View>

        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <InfoRow label="Version" value="1.0.0" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: s(20),
    paddingTop: vs(24),
    paddingBottom: vs(16),
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: s(20),
  },
  card: {
    borderRadius: s(12),
    marginBottom: vs(16),
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: s(16),
  },
});