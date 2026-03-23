import { AppText } from "@/components/common/AppText";
import { BackButton } from "@/components/ui/BackButton";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { VersionFooter } from "@/components/ui/VersionFooter";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import {
  stagger,
  useFadeIn,
  useFadeInUp,
  useScaleIn,
} from "@/hooks/useAnimations";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

type SupportOption = "voice" | "largetext" | "autoscroll";

interface SupportOptionConfig {
  key: SupportOption;
  labelKey: string;
  color: string;
  borderColor: string;
}

export default function SupportScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<SupportOption[]>([]);
  const { colors } = useAppContext();
  const { t } = useTranslation();

  const OPTIONS: SupportOptionConfig[] = [
    {
      key: "voice",
      labelKey: "voiceAssistance",
      color: colors.supportVoiceBg,
      borderColor: colors.supportVoiceBorder,
    },
    {
      key: "largetext",
      labelKey: "largeText",
      color: colors.supportLargeTextBg,
      borderColor: colors.supportLargeTextBorder,
    },
    {
      key: "autoscroll",
      labelKey: "autoScroll",
      color: colors.supportAutoScrollBg,
      borderColor: colors.supportAutoScrollBorder,
    },
  ];

  const toggle = (key: SupportOption) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  // Staggered entrance animations
  const iconAnim = useScaleIn(stagger(0, 120));
  const opt0Anim = useFadeInUp(stagger(1, 120));
  const opt1Anim = useFadeInUp(stagger(2, 120));
  const opt2Anim = useFadeInUp(stagger(3, 120));
  const noteAnim = useFadeIn(stagger(4, 120));
  const skipAnim = useFadeInUp(stagger(5, 120));
  const footerAnim = useFadeIn(stagger(6, 120));
  const optAnims = [opt0Anim, opt1Anim, opt2Anim];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <BackButton />

      <View style={styles.container}>
        <Animated.View style={[styles.iconWrapper, iconAnim]}>
          <AppText size={60}>🫀</AppText>
        </Animated.View>

        <View style={styles.optionsWrapper}>
          {OPTIONS.map((opt, i) => (
            <Animated.View key={opt.key} style={optAnims[i]}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { backgroundColor: opt.color, borderColor: opt.borderColor },
                  selected.includes(opt.key) && styles.optionSelected,
                ]}
                onPress={() => toggle(opt.key)}
                activeOpacity={0.8}
              >
                <AppText
                  size={16}
                  style={{ fontWeight: "500", color: colors.textPrimary }}
                >
                  {t(opt.labelKey)}
                </AppText>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Animated.View style={noteAnim}>
          <AppText
            size={12}
            style={{
              color: colors.textMuted,
              textAlign: "center",
              lineHeight: 18,
              marginBottom: vs(24),
              paddingHorizontal: s(8),
            }}
          >
            {t("supportNote")}
          </AppText>
        </Animated.View>

        <Animated.View style={[{ width: "100%" }, skipAnim]}>
          <TouchableOpacity
            style={[styles.skipButton, { backgroundColor: colors.border }]}
            onPress={() => router.push("/onboarding/showcase")}
            activeOpacity={0.8}
          >
            <AppText
              size={15}
              style={{ fontWeight: "600", color: colors.textPrimary }}
            >
              {t("skip")}
            </AppText>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.footer, footerAnim]}>
          <StepIndicator totalSteps={3} currentStep={1} />
          <VersionFooter />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(32),
    paddingTop: vs(60),
  },
  iconWrapper: { marginBottom: vs(28) },
  optionsWrapper: { width: "100%", gap: vs(12), marginBottom: vs(20) },
  optionButton: {
    width: "100%",
    borderWidth: 1.5,
    borderRadius: s(10),
    paddingVertical: vs(14),
    alignItems: "center",
  },
  optionSelected: { opacity: 0.6 },
  skipButton: {
    width: "100%",
    borderRadius: s(25),
    paddingVertical: vs(15),
    alignItems: "center",
  },
  footer: { alignItems: "center", marginTop: vs(48), gap: vs(12) },
});
