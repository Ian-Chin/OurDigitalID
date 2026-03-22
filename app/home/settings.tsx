import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { s, vs } from '@/constants/layout';
import { useAppContext } from '@/context/AppContext';
import { AppText } from '@/components/common/AppText';
import { ToggleRow } from '@/components/settings/ToggleRow';
import { LinkRow } from '@/components/settings/LinkRow';
import { InfoRow } from '@/components/settings/InfoRow';
// [ADDED]
import { useTranslation } from 'react-i18next';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'cn', label: '中文' },
];

export default function SettingsScreen() {
  const { elderlyMode, setElderlyMode, highContrast, setHighContrast, colors, language, setLanguage } = useAppContext();
  const { t } = useTranslation();
  const tabBarHeight = useBottomTabBarHeight();
  const [langModalVisible, setLangModalVisible] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.backgroundGrouped }]}>
      <View style={styles.header}>
        {/* [CHANGED] hardcoded → t() */}
        <AppText size={28} style={{ fontWeight: '700' }}>{t('settings')}</AppText>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + vs(24) }]}
      >
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          {/* [CHANGED] hardcoded → t() */}
          <ToggleRow label={t('elderlyMode')} value={elderlyMode} onToggle={() => setElderlyMode(!elderlyMode)} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <ToggleRow label={t('highContrastMode')} value={highContrast} onToggle={() => setHighContrast(!highContrast)} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.background }]}>
          {/* [CHANGED] hardcoded → t(), opens modal */}
          <LinkRow label={t('language')} onPress={() => setLangModalVisible(true)} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.background }]}>
          {/* [CHANGED] hardcoded → t() */}
          <LinkRow label={t('privacyPolicy')} />
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
          <LinkRow label={t('termsOfUse')} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.background }]}>
          {/* [CHANGED] hardcoded → t() */}
          <InfoRow label={t('version')} value="1.0.0" />
        </View>
      </ScrollView>

      {/* [ADDED] Language picker modal */}
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
  // [ADDED] modal styles
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
});