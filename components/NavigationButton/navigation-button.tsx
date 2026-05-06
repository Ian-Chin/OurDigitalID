import { AppIcon } from "@/components/common/AppIcon";
import { Elevation, Radii } from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabKey = "home" | "profile" | "service" | "settings";

interface TabDef {
  key: TabKey;
  icon: string;
  route: string;
}

// Order is left-to-right across the bar; the FAB sits between index 1 and 2.
const TABS: TabDef[] = [
  { key: "home", icon: "house.fill", route: "/home/Home" },
  { key: "profile", icon: "person.fill", route: "/profile" },
  { key: "service", icon: "briefcase.fill", route: "/home/service" },
  { key: "settings", icon: "gearshape.fill", route: "/home/settings" },
];

function tabKeyFromPath(pathname: string): TabKey | null {
  if (pathname === "/home/Home" || pathname === "/home") return "home";
  if (
    pathname === "/home/profile" ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/personalinfo")
  )
    return "profile";
  if (pathname === "/home/service" || pathname.startsWith("/service")) return "service";
  if (pathname === "/home/settings") return "settings";
  return null;
}

const FAB_SIZE = 60;
const BAR_HEIGHT = 64;
const PILL_INSET = 6;
// How far the FAB sticks above the bar's top edge.
// Smaller = FAB sits lower into the bar.
const FAB_PROTRUSION = 14;

export default function NavigationButton() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const { colors, elderlyMode } = useAppContext();

  const activeKey = tabKeyFromPath(pathname);
  const activeIndex = useMemo(() => TABS.findIndex((t) => t.key === activeKey), [activeKey]);

  // FAB rotate + pop-out menu
  const animation = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    setIsOpen(!isOpen);
    Animated.timing(animation, {
      toValue,
      duration: 380,
      useNativeDriver: true,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }).start();
  };

  const onPressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.94,
      useNativeDriver: true,
      friction: 7,
      tension: 220,
    }).start();
  const onPressOut = () =>
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 200,
    }).start();

  const spinRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "135deg"],
  });
  const popButtonChat = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -150],
  });
  const popButtonScan = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });
  const popOpacity = animation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0, 1],
  });
  const popScale = animation.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.4, 0.8, 1],
  });
  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });

  const navIconSize = elderlyMode ? 28 : 22;
  const popIconSize = elderlyMode ? 28 : 22;
  const centerIconSize = elderlyMode ? 32 : 26;

  // Sliding pill — measure tab slot width once with onLayout, slide indicator by index.
  const [slotWidth, setSlotWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeIndex < 0 || slotWidth === 0) return;
    Animated.spring(indicatorAnim, {
      toValue: activeIndex,
      useNativeDriver: false,
      friction: 9,
      tension: 90,
    }).start();
  }, [activeIndex, slotWidth]);

  const handleSlotLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (Math.abs(w - slotWidth) > 0.5) setSlotWidth(w);
  };

  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { height: 360 + bottomPad }]}
    >
      {/* Backdrop dim when menu is open */}
      <Animated.View
        pointerEvents={isOpen ? "auto" : "none"}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={toggleMenu} />
      </Animated.View>

      {/* Pop-out menu — anchored to FAB center */}
      <View
        style={[
          styles.popoutContainer,
          { bottom: bottomPad + BAR_HEIGHT + FAB_PROTRUSION + 14 },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.popButtonWrapper,
            {
              transform: [{ translateY: popButtonChat }, { scale: popScale }],
              opacity: popOpacity,
            },
          ]}
          pointerEvents={isOpen ? "auto" : "none"}
        >
          <TouchableOpacity
            style={[
              styles.popButton,
              {
                backgroundColor: colors.backgroundElevated,
                borderColor: colors.borderLight,
                ...Elevation.md,
                shadowColor: colors.shadowDark,
              },
            ]}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            onPress={() => {
              toggleMenu();
              router.navigate("/chatbot/chatbot" as any);
            }}
          >
            <AppIcon size={popIconSize} name="message.fill" color={colors.accent} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.popButtonWrapper,
            {
              transform: [{ translateY: popButtonScan }, { scale: popScale }],
              opacity: popOpacity,
            },
          ]}
          pointerEvents={isOpen ? "auto" : "none"}
        >
          <TouchableOpacity
            style={[
              styles.popButton,
              {
                backgroundColor: colors.backgroundElevated,
                borderColor: colors.borderLight,
                ...Elevation.md,
                shadowColor: colors.shadowDark,
              },
            ]}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            onPress={() => {
              toggleMenu();
              router.navigate("/scan" as any);
            }}
          >
            <AppIcon size={popIconSize} name="qrcode.viewfinder" color={colors.accent} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bottom Bar */}
      <View
        style={[
          styles.navigationBar,
          {
            backgroundColor: colors.backgroundElevated,
            borderTopColor: colors.borderLight,
            paddingBottom: bottomPad,
            height: BAR_HEIGHT + bottomPad,
            ...Elevation.lg,
            shadowColor: colors.shadowDark,
          },
        ]}
      >
        <View style={styles.tabsRow}>
          {/* Left two slots */}
          <View style={styles.sideContainer}>
            <View style={styles.slot} onLayout={handleSlotLayout}>
              {activeIndex === 0 && slotWidth > 0 && (
                <Animated.View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: colors.primarySoft,
                      width: slotWidth - PILL_INSET * 2,
                      left: PILL_INSET,
                    },
                  ]}
                />
              )}
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => router.navigate(TABS[0].route as any)}
                activeOpacity={0.7}
              >
                <AppIcon
                  size={navIconSize}
                  name={TABS[0].icon as any}
                  color={activeKey === TABS[0].key ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.slot}>
              {activeIndex === 1 && slotWidth > 0 && (
                <Animated.View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: colors.primarySoft,
                      width: slotWidth - PILL_INSET * 2,
                      left: PILL_INSET,
                    },
                  ]}
                />
              )}
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => router.navigate(TABS[1].route as any)}
                activeOpacity={0.7}
              >
                <AppIcon
                  size={navIconSize}
                  name={TABS[1].icon as any}
                  color={activeKey === TABS[1].key ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Center FAB gap */}
          <View style={[styles.centerSpace, { width: FAB_SIZE + 24 }]} pointerEvents="none" />

          {/* Right two slots */}
          <View style={styles.sideContainer}>
            <View style={styles.slot}>
              {activeIndex === 2 && slotWidth > 0 && (
                <Animated.View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: colors.primarySoft,
                      width: slotWidth - PILL_INSET * 2,
                      left: PILL_INSET,
                    },
                  ]}
                />
              )}
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => router.navigate(TABS[2].route as any)}
                activeOpacity={0.7}
              >
                <AppIcon
                  size={navIconSize}
                  name={TABS[2].icon as any}
                  color={activeKey === TABS[2].key ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.slot}>
              {activeIndex === 3 && slotWidth > 0 && (
                <Animated.View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: colors.primarySoft,
                      width: slotWidth - PILL_INSET * 2,
                      left: PILL_INSET,
                    },
                  ]}
                />
              )}
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => router.navigate(TABS[3].route as any)}
                activeOpacity={0.7}
              >
                <AppIcon
                  size={navIconSize}
                  name={TABS[3].icon as any}
                  color={activeKey === TABS[3].key ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Center FAB — sits centered on the top edge of the bar */}
      <View
        style={[
          styles.absoluteCenter,
          { bottom: bottomPad + BAR_HEIGHT + FAB_PROTRUSION - FAB_SIZE },
        ]}
        pointerEvents="box-none"
      >
        <Animated.View style={{ transform: [{ scale: pressScale }] }}>
          <TouchableOpacity
            onPress={toggleMenu}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            activeOpacity={0.9}
            style={[
              styles.centerButton,
              {
                backgroundColor: colors.primary,
                ...Elevation.lg,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
              <AppIcon
                size={centerIconSize}
                name="plus"
                color={colors.textOnPrimary}
              />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 10,
  },
  backdrop: {
    position: "absolute",
    top: -2000,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0B1220",
    zIndex: 1,
  },
  navigationBar: {
    width: "100%",
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  tabsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sideContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  slot: {
    flex: 1,
    height: BAR_HEIGHT - 8,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  navButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  pill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    borderRadius: Radii.md,
    zIndex: 1,
  },
  centerSpace: {
    height: BAR_HEIGHT - 8,
  },
  absoluteCenter: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  centerButton: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  popoutContainer: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    zIndex: 25,
    elevation: 25,
  },
  popButtonWrapper: {
    position: "absolute",
    bottom: 0,
  },
  popButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
