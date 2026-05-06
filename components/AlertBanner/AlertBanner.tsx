import { AppIcon } from "@/components/common/AppIcon";
import { AppText } from "@/components/common/AppText";
import { Elevation, Radii } from "@/constants/colors";
import { useAppContext, type AlertKind } from "@/context/AppContext";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const KIND_STYLE: Record<
  AlertKind,
  {
    icon: string;
    label: string;
    gradient: readonly [string, string, ...string[]];
    accent: string;
  }
> = {
  flood: {
    icon: "cloud.rain.fill",
    label: "FLOOD ALERT",
    gradient: ["#0E2540", "#0B5E8C", "#0891B2"],
    accent: "#7DD3FC",
  },
  earthquake: {
    icon: "waveform.path.ecg",
    label: "SEISMIC ALERT",
    gradient: ["#3B0F0F", "#9A2424", "#DC2626"],
    accent: "#FCA5A5",
  },
  weather: {
    icon: "cloud.bolt.rain.fill",
    label: "WEATHER ALERT",
    gradient: ["#3A1A4A", "#6B21A8", "#A855F7"],
    accent: "#E9D5FF",
  },
};

export function AlertBanner() {
  const insets = useSafeAreaInsets();
  const { activeAlert, dismissAlert } = useAppContext();

  const translateY = useSharedValue(-220);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const ringPulse = useSharedValue(0);

  useEffect(() => {
    if (activeAlert) {
      // Entrance: slide down + scale up + fade in
      opacity.value = withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      });
      translateY.value = withSpring(0, {
        damping: 16,
        stiffness: 140,
        mass: 0.85,
      });
      scale.value = withSpring(1, {
        damping: 14,
        stiffness: 180,
      });
      // Pulsing ring around icon for urgency
      ringPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      );

      const timer = setTimeout(() => dismissAlert(), 6000);
      return () => clearTimeout(timer);
    }
    // Exit: fade & slide up
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(-220, {
      duration: 260,
      easing: Easing.in(Easing.cubic),
    });
    scale.value = withDelay(60, withTiming(0.94, { duration: 180 }));
  }, [activeAlert]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 - ringPulse.value * 0.5,
    transform: [{ scale: 1 + ringPulse.value * 0.6 }],
  }));

  if (!activeAlert) return null;
  const meta = KIND_STYLE[activeAlert.kind];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingTop: insets.top + 8 }, cardStyle]}
    >
      <Pressable
        onPress={dismissAlert}
        style={({ pressed }) => [
          styles.banner,
          { transform: [{ scale: pressed ? 0.985 : 1 }] },
          Elevation.lg,
          { shadowColor: meta.gradient[2] },
        ]}
      >
        <LinearGradient
          colors={meta.gradient as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* decorative orbs */}
        <View
          style={[styles.orb, { backgroundColor: meta.accent + "26" }]}
          pointerEvents="none"
        />
        <View
          style={[styles.orbBottom, { backgroundColor: meta.accent + "1A" }]}
          pointerEvents="none"
        />

        {/* Live indicator strip */}
        <View style={styles.topStrip}>
          <View style={[styles.liveDot, { backgroundColor: meta.accent }]} />
          <AppText
            size={10}
            style={{
              color: meta.accent,
              fontWeight: "800",
              letterSpacing: 1.6,
            }}
          >
            {meta.label}
          </AppText>
          <View style={{ flex: 1 }} />
          <View style={styles.dismissPill}>
            <AppIcon name="xmark" size={10} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.iconColumn}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.iconRing,
                { borderColor: meta.accent },
                ringStyle,
              ]}
            />
            <View style={[styles.iconCircle, { backgroundColor: meta.accent + "33", borderColor: meta.accent + "55" }]}>
              <AppIcon name={meta.icon} size={22} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.textBlock}>
            <AppText size={15} style={styles.title} numberOfLines={2}>
              {activeAlert.title}
            </AppText>
            <AppText size={12} style={styles.bodyText} numberOfLines={3}>
              {activeAlert.body}
            </AppText>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.tapHintRow}>
            <View style={[styles.tapDot, { backgroundColor: meta.accent }]} />
            <AppText
              size={10}
              style={{
                color: "rgba(255,255,255,0.78)",
                fontWeight: "600",
                letterSpacing: 0.8,
              }}
            >
              Tap to dismiss · auto-clears in 6s
            </AppText>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    zIndex: 9999,
    elevation: 20,
  },
  banner: {
    borderRadius: Radii.lg,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  orb: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -120,
    right: -60,
  },
  orbBottom: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -100,
    left: -40,
  },
  topStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dismissPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconColumn: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRing: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  bodyText: {
    color: "rgba(255,255,255,0.88)",
    lineHeight: 17,
  },
  footerRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.18)",
  },
  tapHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tapDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
