import { IconSymbol } from "@/components/ui/icon-symbol";
import { usePathname, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
// Import context and AppIcon (elderly mode usage)
import { useAppContext } from "@/context/AppContext";
import { AppIcon } from "@/components/common/AppIcon";

export default function NavigationButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  // Get colors and elderlyMode from context
  const { colors, elderlyMode } = useAppContext();

  // Determine active tab from current route
  const isHome = pathname === "/home/Home" || pathname === "/home";
  const isProfile = pathname.startsWith("/personalinfo");
  const isService = pathname.startsWith("/service");
  const isSettings = pathname === "/home/settings";

  // Animation value for the central interactions
  const animation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;

    // We update the state immediately to keep the UI interactive,
    // but the animation dictates the visual open/close state.
    setIsOpen(!isOpen);

    Animated.timing(animation, {
      toValue,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start();
  };

  // Interpolations
  const spinRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const popButton1TranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -80], // Start slightly below surface, then pop up to -80
  });

  const popButton2TranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -150], // Start slightly below surface, then pop up to -150
  });

  const popOpacity = animation.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  // Scale effect so they "grow" into place and "shrink" when hiding
  const popScale = animation.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0.5, 0.8, 1],
  });

  // [ADDED] elderly-aware icon sizes
  const navIconSize = elderlyMode ? 34 : 28;
  const popIconSize = elderlyMode ? 28 : 24;
  const centerIconSize = elderlyMode ? 38 : 32;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Pop-out Buttons Container */}
      <View style={styles.popoutContainer} pointerEvents="box-none">
        {/* Top pop-out button (Message) */}
        <Animated.View
          style={[
            styles.popButtonWrapper,
            {
              transform: [
                { translateY: popButton2TranslateY },
                { scale: popScale },
              ],
              opacity: popOpacity,
            },
          ]}
          pointerEvents={isOpen ? "auto" : "none"}
        >
          <TouchableOpacity
            style={[styles.popButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            onPress={() => router.navigate("/chatbot/chatbot" as any)}
          >
            <AppIcon size={popIconSize} name="message.fill" color={colors.textPrimary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom pop-out button (Scan) */}
        <Animated.View
          style={[
            styles.popButtonWrapper,
            {
              transform: [
                { translateY: popButton1TranslateY },
                { scale: popScale },
              ],
              opacity: popOpacity,
            },
          ]}
          pointerEvents={isOpen ? "auto" : "none"}
        >
          <TouchableOpacity
            style={[styles.popButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            onPress={() => router.navigate("/scan" as any)}
          >
            <AppIcon size={popIconSize} name="qrcode.viewfinder" color={colors.textPrimary} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* [CHANGED] backgroundColor and borderTopColor uses colors */}
      <View style={[styles.navigationBar, { backgroundColor: colors.background, borderTopColor: colors.borderLight }]}>
        {/* Left Side Buttons */}
        <View style={styles.sideContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/home/Home" as any)}
          >
            <AppIcon size={navIconSize} name="house.fill" color={isHome ? colors.primary : colors.textPrimary} />
            {isHome && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/personalinfo" as any)}
          >
            <AppIcon size={navIconSize} name="person.fill" color={isProfile ? colors.primary : colors.textPrimary} />
            {isProfile && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        </View>

        {/* Empty space to make room for Center Button */}
        <View style={styles.centerSpace} pointerEvents="none" />

        {/* Right Side Buttons */}
        <View style={styles.sideContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/service/service-page" as any)}
          >
            <AppIcon size={navIconSize} name="briefcase.fill" color={isService ? colors.primary : colors.textPrimary} />
            {isService && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/home/settings" as any)}
          >
            <AppIcon size={navIconSize} name="gearshape.fill" color={isSettings ? colors.primary : colors.textPrimary} />
            {isSettings && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Actual Center Button */}
      <View style={styles.absoluteCenter} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
          <TouchableOpacity
            // [CHANGED] backgroundColor and borderColor uses colors
            style={[styles.centerButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={toggleMenu}
            activeOpacity={0.9}
          >
            {/* [CHANGED] IconSymbol → AppIcon */}
            <AppIcon size={centerIconSize} name="plus" color={colors.textPrimary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

// [NOTE] StyleSheet stays unchanged — colors from context must be applied inline above
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300, // Covers bottom part to intercept touches when menu is open
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    height: 1000,
    top: -700,
    backgroundColor: "rgba(0,0,0,0)",
    zIndex: 1,
    elevation: 1,
  },
  navigationBar: {
    width: "100%",
    height: 75,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingBottom: 5,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 10,
  },
  sideContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
  },
  navButton: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
  centerSpace: {
    width: 60,
  },
  absoluteCenter: {
    position: "absolute",
    bottom: 25,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  centerButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  popoutContainer: {
    position: "absolute",
    bottom: 45,
    alignItems: "center",
    zIndex: 25,
    elevation: 25,
  },
  popButtonWrapper: {
    position: "absolute",
    bottom: 0,
  },
  popButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
});