import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

export default function NavigationButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

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

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Background overlay to close the menu if tapped outside */}
      {isOpen && <View style={styles.overlay} onTouchEnd={toggleMenu} />}

      {/* Pop-out Buttons Container */}
      <View style={styles.popoutContainer} pointerEvents="box-none">
        {/* Top pop-out button (Message) */}
        <Animated.View
          style={[
            styles.popButtonWrapper,
            {
              transform: [{ translateY: popButton2TranslateY }],
              opacity: popOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.popButton}
            onPress={() => {
              toggleMenu();
              router.push("/message" as any); // link to message page
            }}
            disabled={!isOpen}
          >
            <IconSymbol size={24} name="message.fill" color="#000" />
          </TouchableOpacity>
        </Animated.View>

        {/* Bottom pop-out button (Scan) */}
        <Animated.View
          style={[
            styles.popButtonWrapper,
            {
              transform: [{ translateY: popButton1TranslateY }],
              opacity: popOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.popButton}
            onPress={() => {
              toggleMenu();
              router.push("/scan" as any); // link to scan page
            }}
            disabled={!isOpen}
          >
            <IconSymbol size={24} name="qrcode.viewfinder" color="#000" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.navigationBar}>
        {/* Left Side Buttons */}
        <View style={styles.sideContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/home/Home" as any)}
          >
            <IconSymbol size={28} name="house.fill" color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/personalinfo" as any)}
          >
            <IconSymbol size={28} name="person.fill" color="#000" />
          </TouchableOpacity>
        </View>

        {/* Empty space to make room for Center Button */}
        <View style={styles.centerSpace} pointerEvents="none" />

        {/* Right Side Buttons */}
        <View style={styles.sideContainer}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/community" as any)}
          >
            <IconSymbol size={28} name="briefcase.fill" color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/home/settings" as any)}
          >
            <IconSymbol size={28} name="gearshape.fill" color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Actual Center Button */}
      <View style={styles.absoluteCenter} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
          <TouchableOpacity
            style={styles.centerButton}
            onPress={toggleMenu}
            activeOpacity={0.9}
          >
            <IconSymbol size={32} name="plus" color="#000" />
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
  },
  navigationBar: {
    width: "100%",
    height: 75,
    backgroundColor: "#FFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
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
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
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
    zIndex: 15,
  },
  popButtonWrapper: {
    position: "absolute",
    bottom: 0,
  },
  popButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
});
