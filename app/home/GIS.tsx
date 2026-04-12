import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/common/AppText';
import { useAppContext } from '@/context/AppContext';
import { s, vs } from '@/constants/layout';
import { stagger, useFadeInUp } from '@/hooks/useAnimations';

export default function GISPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();
  const { t } = useTranslation();

  // Animations
  const titleAnim = useFadeInUp(stagger(0, 100));
  const contentAnim = useFadeInUp(stagger(1, 100));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingTop: 12 + insets.top,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText
          size={18}
          style={{
            fontWeight: '700',
            color: colors.textPrimary,
            flex: 1,
            textAlign: 'center',
            marginRight: 24,
          }}
        >
          {t('gis')}
        </AppText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ padding: s(16) }}>
          {/* Title Section */}
          <Animated.View style={[styles.titleSection, titleAnim]}>
            <AppText
              size={18}
              style={{ fontWeight: '700', marginBottom: vs(4), color: colors.textPrimary }}
            >
              Geographic Information System
            </AppText>
          </Animated.View>

          {/* Content Section */}
          <Animated.View style={contentAnim}>
            <View
              style={[styles.sectionCard, { backgroundColor: colors.backgroundGrouped }]}
            >
              <AppText
                size={14}
                style={{ color: colors.textSecondary, lineHeight: 20 }}
              >
                GIS content coming soon
              </AppText>
            </View>
          </Animated.View>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  titleSection: {
    marginBottom: vs(12),
  },
  sectionCard: {
    borderRadius: 8,
    padding: s(12),
    marginBottom: vs(12),
  },
});
