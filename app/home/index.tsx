import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { s, vs } from '@/constants/layout';
import { useAppContext } from '@/context/AppContext';
import { AppText } from '@/components/common/AppText';

export default function HomeScreen() {
  const { colors, elderlyMode } = useAppContext();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.spacer} />
        <TouchableOpacity style={[styles.notifButton, { backgroundColor: colors.notifButtonBg }]} activeOpacity={0.7}>
          <Ionicons
            name="notifications-outline"
            //increase icon size for elderly mode
            size={elderlyMode ? s(28) : s(22)}
            color={colors.textPrimary}
          />
          <View style={[styles.notifBadge, { backgroundColor: colors.notifBadge, borderColor: colors.notifButtonBg }]} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <AppText size={24} style={{ fontWeight: '700', marginBottom: vs(8) }}>Home</AppText>
        <AppText size={15} style={{ color: colors.textSecondary }}>Welcome to OurDigitalID</AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    borderWidth: 1.5,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});