import { AppIcon } from "@/components/common/AppIcon";
import { AppText } from "@/components/common/AppText";
import { useAppContext, type AlertKind } from "@/context/AppContext";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STYLES_BY_KIND: Record<
  AlertKind,
  { icon: string; color: string; bg: string }
> = {
  flood: { icon: "cloud.rain.fill", color: "#FFFFFF", bg: "#0277BD" },
  earthquake: { icon: "waveform.path.ecg", color: "#FFFFFF", bg: "#E65100" },
  weather: { icon: "cloud.bolt.rain.fill", color: "#FFFFFF", bg: "#6A1B9A" },
};

export function AlertBanner() {
  const insets = useSafeAreaInsets();
  const { activeAlert, dismissAlert } = useAppContext();

  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (activeAlert) {
      translateY.value = withSpring(0, { damping: 14, stiffness: 110 });
      opacity.value = withTiming(1, { duration: 200 });
      const timer = setTimeout(() => {
        dismissAlert();
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      translateY.value = withTiming(-200, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [activeAlert]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!activeAlert) return null;

  const style = STYLES_BY_KIND[activeAlert.kind];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingTop: insets.top + 8 }, animStyle]}
    >
      <Pressable
        onPress={dismissAlert}
        style={[styles.banner, { backgroundColor: style.bg }]}
      >
        <View style={[styles.iconCircle, { backgroundColor: "#FFFFFF22" }]}>
          <AppIcon name={style.icon} size={22} color={style.color} />
        </View>
        <View style={styles.textBlock}>
          <AppText size={14} style={styles.title}>
            {activeAlert.title}
          </AppText>
          <AppText size={12} style={styles.body}>
            {activeAlert.body}
          </AppText>
        </View>
        <AppIcon name="xmark" size={16} color="#FFFFFFCC" />
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
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 2,
  },
  body: {
    color: "#FFFFFFDD",
    lineHeight: 16,
  },
});
