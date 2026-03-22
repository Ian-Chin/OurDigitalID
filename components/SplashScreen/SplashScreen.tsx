import React, { useEffect, useCallback } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // Scan line sweeps down the screen
  const scanLineY = useSharedValue(-0.1);
  const scanLineOpacity = useSharedValue(0);
  const scanGlowOpacity = useSharedValue(0);

  // Logo materializes as scan passes
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);

  // Fingerprint pulse — after logo appears, a subtle cyan pulse radiates
  const pulseScale = useSharedValue(0.8);
  const pulseOpacity = useSharedValue(0);
  const pulse2Scale = useSharedValue(0.8);
  const pulse2Opacity = useSharedValue(0);

  // Text
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);

  // Exit
  const screenOpacity = useSharedValue(1);

  const triggerFinish = useCallback(() => {
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    // === Phase 1: Scan line appears and sweeps down (0ms) ===
    scanLineOpacity.value = withTiming(1, { duration: 300 });
    scanGlowOpacity.value = withDelay(
      100,
      withTiming(0.6, { duration: 400 })
    );

    // Scan line moves from top to ~60% of screen
    scanLineY.value = withTiming(0.58, {
      duration: 1400,
      easing: Easing.inOut(Easing.quad),
    });

    // === Phase 2: Logo materializes as scan passes center (600ms) ===
    logoOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    logoScale.value = withDelay(
      600,
      withSpring(1, { damping: 14, stiffness: 100, mass: 0.9 })
    );

    // === Phase 3: Scan line fades out after passing (1400ms) ===
    scanLineOpacity.value = withDelay(
      1200,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) })
    );
    scanGlowOpacity.value = withDelay(
      1200,
      withTiming(0, { duration: 400 })
    );

    // === Phase 4: Fingerprint pulse rings (1000ms, 1300ms) ===
    pulseOpacity.value = withDelay(
      1000,
      withSequence(
        withTiming(0.5, { duration: 300 }),
        withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) })
      )
    );
    pulseScale.value = withDelay(
      1000,
      withTiming(2.8, { duration: 1100, easing: Easing.out(Easing.cubic) })
    );

    pulse2Opacity.value = withDelay(
      1300,
      withSequence(
        withTiming(0.35, { duration: 300 }),
        withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) })
      )
    );
    pulse2Scale.value = withDelay(
      1300,
      withTiming(3.5, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );

    // === Phase 5: Text slides in (1200ms) ===
    titleOpacity.value = withDelay(
      1200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    titleTranslateY.value = withDelay(
      1200,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    subtitleOpacity.value = withDelay(
      1500,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) })
    );

    // === Phase 6: Exit — smooth fade out (3200ms) ===
    screenOpacity.value = withDelay(
      3200,
      withTiming(0, { duration: 800, easing: Easing.inOut(Easing.quad) })
    );

    const timer = setTimeout(() => {
      triggerFinish();
    }, 4100);

    return () => clearTimeout(timer);
  }, []);

  // --- Animated Styles ---

  const scanLineStyle = useAnimatedStyle(() => ({
    opacity: scanLineOpacity.value,
    top: interpolate(scanLineY.value, [0, 1], [0, SCREEN_H]),
  }));

  const scanGlowStyle = useAnimatedStyle(() => ({
    opacity: scanGlowOpacity.value,
    top: interpolate(scanLineY.value, [0, 1], [-60, SCREEN_H - 60]),
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const pulse2Style = useAnimatedStyle(() => ({
    opacity: pulse2Opacity.value,
    transform: [{ scale: pulse2Scale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const exitStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.root, exitStyle]}>
      {/* Clean white background */}
      <View style={styles.background} />

      {/* Subtle grid pattern overlay for texture */}
      <View style={styles.gridOverlay}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={`h${i}`}
            style={[
              styles.gridLineH,
              { top: SCREEN_H * ((i + 1) / 9) },
            ]}
          />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={`v${i}`}
            style={[
              styles.gridLineV,
              { left: SCREEN_W * ((i + 1) / 6) },
            ]}
          />
        ))}
      </View>

      {/* Scan line glow (wider diffused light behind the line) */}
      <Animated.View style={[styles.scanGlow, scanGlowStyle]}>
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,210,235,0.08)",
            "rgba(0,210,235,0.15)",
            "rgba(0,210,235,0.08)",
            "transparent",
          ]}
          style={styles.scanGlowGradient}
        />
      </Animated.View>

      {/* Scan line */}
      <Animated.View style={[styles.scanLine, scanLineStyle]}>
        <LinearGradient
          colors={[
            "transparent",
            "rgba(0,210,235,0.4)",
            "#00D2EB",
            "rgba(0,210,235,0.4)",
            "transparent",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.scanLineGradient}
        />
      </Animated.View>

      {/* Pulse rings from logo center */}
      <Animated.View style={[styles.pulseRing, pulseStyle]}>
        <View style={[styles.pulseCircle, { borderColor: "rgba(0,210,235,0.4)" }]} />
      </Animated.View>
      <Animated.View style={[styles.pulseRing, pulse2Style]}>
        <View style={[styles.pulseCircle, { borderColor: "rgba(0,210,235,0.2)" }]} />
      </Animated.View>

      {/* Center content */}
      <View style={styles.centerContent} pointerEvents="none">
        {/* Logo */}
        <Animated.View style={[styles.logoWrapper, logoStyle]}>
          <Image
            source={require("../../assets/images/logo_small.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App name */}
        <Animated.Text style={[styles.title, titleStyle]}>
          OurDigitalID
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          Your Smarter Digital Identity
        </Animated.Text>
      </View>

    </Animated.View>
  );
}

const LOGO_SIZE = Math.min(SCREEN_W * 0.32, 140);

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FAFBFC",
  },
  // Subtle grid texture
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,30,60,0.04)",
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,30,60,0.04)",
  },
  // Scan line
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    zIndex: 10,
  },
  scanLineGradient: {
    flex: 1,
  },
  scanGlow: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 120,
    zIndex: 9,
  },
  scanGlowGradient: {
    flex: 1,
  },
  // Pulse rings
  pulseRing: {
    position: "absolute",
    top: SCREEN_H * 0.5 - 50,
    left: SCREEN_W * 0.5 - 50,
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  pulseCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  // Center
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 15,
  },
  logoWrapper: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1B2D45",
    letterSpacing: 1,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#8E9BAE",
    letterSpacing: 1.5,
    marginTop: 8,
    textTransform: "uppercase",
  },
});
