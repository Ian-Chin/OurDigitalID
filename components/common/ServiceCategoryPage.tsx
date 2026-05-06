import { AppText } from "@/components/common/AppText";
import { Elevation, Gradients, Radii } from "@/constants/colors";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import React, { memo, useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface ServiceItem {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

interface Props {
  title: string;
  subtitle?: string;
  /** Ionicon shown in the hero header. */
  heroIcon: keyof typeof Ionicons.glyphMap;
  services: ServiceItem[];
}

const ServiceRow = memo(
  ({
    item,
    colors,
    delay,
  }: {
    item: ServiceItem;
    colors: any;
    delay: number;
  }) => {
    const anim = useFadeInUp(delay);
    return (
      <Animated.View style={anim}>
        <Pressable
          onPress={item.onPress}
          android_ripple={{ color: "rgba(0,0,0,0.05)" }}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderLight,
              transform: [{ scale: pressed ? 0.985 : 1 }],
            },
            Elevation.sm,
            { shadowColor: "#0B1220" },
          ]}
        >
          <View
            style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}
          >
            <Ionicons
              name={item.icon ?? "document-text-outline"}
              size={18}
              color={colors.primary}
            />
          </View>
          <AppText
            size={14}
            style={{
              fontWeight: "700",
              color: colors.textPrimary,
              flex: 1,
              letterSpacing: -0.1,
            }}
          >
            {item.label}
          </AppText>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textPlaceholder}
          />
        </Pressable>
      </Animated.View>
    );
  },
);

export function ServiceCategoryPage({
  title,
  subtitle,
  heroIcon,
  services,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();

  const titleAnim = useFadeInUp(stagger(0, 80));

  const handleBack = useCallback(() => router.back(), [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Hero gradient */}
      <LinearGradient
        colors={Gradients.hero as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.hero,
          { paddingTop: Math.max(insets.top * 0.4, 8) + 6 },
        ]}
      >
        <View style={styles.heroOrbA} pointerEvents="none" />
        <View style={styles.heroOrbB} pointerEvents="none" />

        <View style={styles.heroTopRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleBack}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.heroIconBadge}>
            <Ionicons name={heroIcon} size={18} color="#06B6D4" />
          </View>
        </View>

        <Animated.View style={[{ marginTop: 14 }, titleAnim]}>
          <AppText
            size={11}
            style={{
              color: "rgba(255,255,255,0.65)",
              letterSpacing: 1.6,
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            Government Services
          </AppText>
          <AppText
            size={26}
            style={{
              color: "#FFF",
              fontWeight: "800",
              marginTop: 2,
              letterSpacing: -0.6,
            }}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText
              size={13}
              style={{
                color: "rgba(255,255,255,0.78)",
                marginTop: 4,
              }}
            >
              {subtitle}
            </AppText>
          ) : null}
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ padding: s(16), paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      >
        <AppText
          size={11}
          style={{
            color: colors.textSecondary,
            letterSpacing: 1.4,
            fontWeight: "700",
            textTransform: "uppercase",
            marginBottom: vs(10),
            marginTop: vs(4),
          }}
        >
          Available · {services.length}
        </AppText>

        {services.map((item, index) => (
          <ServiceRow
            key={item.label}
            item={item}
            colors={colors}
            delay={(index + 1) * 70}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
    overflow: "hidden",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroOrbA: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -100,
    right: -60,
    backgroundColor: "rgba(6,182,212,0.18)",
  },
  heroOrbB: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -80,
    left: -50,
    backgroundColor: "rgba(245,158,11,0.10)",
  },
  content: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(14),
    paddingHorizontal: s(14),
    marginBottom: vs(10),
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
