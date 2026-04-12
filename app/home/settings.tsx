import React, { useState } from 'react';
import {
  Alert,
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { s, vs } from '@/constants/layout';
import { useAppContext } from '@/context/AppContext';
import { AppText } from '@/components/common/AppText';
import { ToggleRow } from '@/components/settings/ToggleRow';
import { LinkRow } from '@/components/settings/LinkRow';
import { InfoRow } from '@/components/settings/InfoRow';
import { useTranslation } from 'react-i18next';
import { useFadeInUp, useFadeIn, stagger } from '@/hooks/useAnimations';
import { auth } from '@/services/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'cn', label: '中文' },
];

export default function SettingsScreen() {
  const { elderlyMode, setElderlyMode, highContrast, setHighContrast, colors, language, setLanguage, setUserProfile } = useAppContext();
  const { t } = useTranslation();
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            setUserProfile(null);
            router.replace("/onboarding/showcase");
          } catch (err) {
            console.error("[settings] Logout failed:", err);
          }
        },
      },
    ]);
  };

  // Staggered card animations
  const headerAnim = useFadeInUp(stagger(0, 100));
  const card1Anim = useFadeInUp(stagger(1, 100));
  const card2Anim = useFadeInUp(stagger(2, 100));
  const card3Anim = useFadeInUp(stagger(3, 100));
  const card4Anim = useFadeInUp(stagger(4, 100));
  const card5Anim = useFadeInUp(stagger(5, 100));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.header, headerAnim]}>
        <AppText size={28} style={{ fontWeight: '700' }}>{t('settings')}</AppText>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + vs(24) }]}
      >
        <Animated.View style={[styles.card, { backgroundColor: colors.backgroundGrouped }, card1Anim]}>
          <ToggleRow label={t('elderlyMode')} value={elderlyMode} onToggle={() => setElderlyMode(!elderlyMode)} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <ToggleRow label={t('highContrastMode')} value={highContrast} onToggle={() => setHighContrast(!highContrast)} />
        </Animated.View>

        <Animated.View style={[styles.card, { backgroundColor: colors.backgroundGrouped }, card2Anim]}>
          <LinkRow label={t('language')} onPress={() => setLangModalVisible(true)} />
        </Animated.View>

        <Animated.View style={[styles.card, { backgroundColor: colors.backgroundGrouped }, card3Anim]}>
          <LinkRow label={t('privacyPolicy')} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <LinkRow label={t('termsOfUse')} />
        </Animated.View>

        <Animated.View style={[styles.card, { backgroundColor: colors.backgroundGrouped }, card4Anim]}>
          <InfoRow label={t('version')} value="1.0.0" />
        </Animated.View>

        <Animated.View style={[styles.card, card5Anim]}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <AppText size={16} style={{ fontWeight: '600', color: '#E53935', textAlign: 'center' }}>
              Log Out
            </AppText>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Language picker modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <AppText size={18} style={{ fontWeight: '700', marginBottom: vs(16) }}>
              {t('language')}
            </AppText>

            {LANGUAGE_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.langOption,
                  {
                    backgroundColor: language === option.value
                      ? colors.primary
                      : colors.backgroundGrouped,
                    marginBottom: index < LANGUAGE_OPTIONS.length - 1 ? vs(8) : 0,
                  }
                ]}
                onPress={() => {
                  setLanguage(option.value as any);
                  setLangModalVisible(false);
                }}
              >
                <AppText
                  size={16}
                  style={{
                    fontWeight: '600',
                    color: language === option.value ? '#FFFFFF' : colors.textPrimary,
                  }}
                >
                  {option.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: s(280),
    borderRadius: s(16),
    padding: s(24),
  },
  langOption: {
    paddingVertical: vs(14),
    paddingHorizontal: s(16),
    borderRadius: s(10),
    alignItems: 'center',
  },
  logoutBtn: {
    paddingVertical: vs(16),
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: s(12),
  },
});
