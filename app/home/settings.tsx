import { AppText } from "@/components/common/AppText";
import { InfoRow } from "@/components/settings/InfoRow";
import { LinkRow } from "@/components/settings/LinkRow";
import { ToggleRow } from "@/components/settings/ToggleRow";
import { Elevation, Radii } from "@/constants/colors";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { auth } from "@/services/firebase";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { value: "cn", label: "中文", flag: "🇨🇳" },
];

export default function SettingsScreen() {
  const {
    elderlyMode,
    setElderlyMode,
    highContrast,
    setHighContrast,
    colors,
    language,
    setLanguage,
    setUserProfile,
  } = useAppContext();
  const { t } = useTranslation();
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const performLogout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      router.replace("/onboarding/showcase");
    } catch (err) {
      console.error("[settings] Logout failed:", err);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const ok =
        typeof window !== "undefined" &&
        window.confirm("Are you sure you want to log out?");
      if (ok) performLogout();
      return;
    }
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: performLogout },
    ]);
  };

  const headerAnim = useFadeInUp(stagger(0, 80));
  const card1Anim = useFadeInUp(stagger(1, 80));
  const card2Anim = useFadeInUp(stagger(2, 80));
  const card3Anim = useFadeInUp(stagger(3, 80));
  const card4Anim = useFadeInUp(stagger(4, 80));
  const card5Anim = useFadeInUp(stagger(5, 80));

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.backgroundElevated,
      borderColor: colors.borderLight,
    },
    Elevation.sm,
    { shadowColor: "#0B1220" },
  ];

  const currentLang = LANGUAGE_OPTIONS.find((o) => o.value === language);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Animated.View style={[styles.header, headerAnim]}>
        <AppText
          size={11}
          style={{
            color: colors.textSecondary,
            letterSpacing: 1.6,
            fontWeight: "700",
            textTransform: "uppercase",
          }}
        >
          Preferences
        </AppText>
        <AppText
          size={28}
          style={{
            fontWeight: "800",
            color: colors.textPrimary,
            letterSpacing: -0.6,
            marginTop: 2,
          }}
        >
          {t("settings")}
        </AppText>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + vs(40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Accessibility */}
        <Animated.View style={[cardStyle, card1Anim]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="accessibility-outline" size={14} color={colors.primary} />
            <AppText
              size={11}
              style={{
                color: colors.textSecondary,
                letterSpacing: 1.2,
                fontWeight: "700",
                textTransform: "uppercase",
                marginLeft: 6,
              }}
            >
              Accessibility
            </AppText>
          </View>
          <ToggleRow
            label={t("elderlyMode")}
            value={elderlyMode}
            onToggle={() => setElderlyMode(!elderlyMode)}
          />
          <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />
          <ToggleRow
            label={t("highContrastMode")}
            value={highContrast}
            onToggle={() => setHighContrast(!highContrast)}
          />
        </Animated.View>

        {/* Language */}
        <Animated.View style={[cardStyle, card2Anim]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setLangModalVisible(true)}
            style={styles.langRow}
          >
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="globe-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <AppText size={15} style={{ fontWeight: "700", color: colors.textPrimary }}>
                {t("language")}
              </AppText>
              <AppText size={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
                {currentLang?.flag} {currentLang?.label}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textPlaceholder} />
          </TouchableOpacity>
        </Animated.View>

        {/* Legal */}
        <Animated.View style={[cardStyle, card3Anim]}>
          <View style={styles.sectionLabel}>
            <Ionicons name="document-text-outline" size={14} color={colors.primary} />
            <AppText
              size={11}
              style={{
                color: colors.textSecondary,
                letterSpacing: 1.2,
                fontWeight: "700",
                textTransform: "uppercase",
                marginLeft: 6,
              }}
            >
              Legal
            </AppText>
          </View>
          <LinkRow label={t("privacyPolicy")} />
          <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />
          <LinkRow label={t("termsOfUse")} />
        </Animated.View>

        {/* Version */}
        <Animated.View style={[cardStyle, card4Anim]}>
          <InfoRow label={t("version")} value="1.0.0" />
        </Animated.View>

        {/* Logout */}
        <Animated.View style={card5Anim}>
          <TouchableOpacity
            style={[
              styles.logoutBtn,
              { backgroundColor: colors.errorSoft, borderColor: colors.error + "33" },
            ]}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <AppText
              size={15}
              style={{
                fontWeight: "700",
                color: colors.error,
                marginLeft: 8,
                letterSpacing: 0.2,
              }}
            >
              Log Out
            </AppText>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Language modal */}
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
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.backgroundElevated },
              Elevation.lg,
              { shadowColor: "#0B1220" },
            ]}
          >
            <View style={styles.modalHandle} />
            <AppText
              size={11}
              style={{
                color: colors.textSecondary,
                letterSpacing: 1.4,
                fontWeight: "700",
                textTransform: "uppercase",
              }}
            >
              Choose
            </AppText>
            <AppText
              size={20}
              style={{
                fontWeight: "800",
                color: colors.textPrimary,
                marginTop: 2,
                marginBottom: vs(16),
                letterSpacing: -0.4,
              }}
            >
              {t("language")}
            </AppText>

            {LANGUAGE_OPTIONS.map((option, index) => {
              const active = language === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.langOption,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : colors.backgroundGrouped,
                      marginBottom: index < LANGUAGE_OPTIONS.length - 1 ? vs(8) : 0,
                    },
                  ]}
                  onPress={() => {
                    setLanguage(option.value as any);
                    setLangModalVisible(false);
                  }}
                  activeOpacity={0.85}
                >
                  <AppText size={20}>{option.flag}</AppText>
                  <AppText
                    size={15}
                    style={{
                      fontWeight: "700",
                      color: active ? "#FFF" : colors.textPrimary,
                      marginLeft: 12,
                      flex: 1,
                    }}
                  >
                    {option.label}
                  </AppText>
                  {active && <Ionicons name="checkmark-circle" size={20} color="#FFF" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: s(20),
    paddingTop: vs(4),
    paddingBottom: vs(12),
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: s(20) },
  card: {
    borderRadius: Radii.lg,
    marginBottom: vs(14),
    paddingVertical: vs(6),
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingTop: vs(10),
    paddingBottom: vs(2),
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: s(16),
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(14),
    paddingVertical: vs(14),
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(16),
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: vs(8),
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(11,18,32,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    width: "100%",
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: s(20),
    paddingTop: s(12),
    paddingBottom: s(28),
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D4D4CC",
    marginBottom: 16,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(14),
    paddingHorizontal: s(16),
    borderRadius: Radii.md,
  },
});
