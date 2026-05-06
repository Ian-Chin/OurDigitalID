import { AppColors } from "@/constants/colors";
import { fs, s, vs } from "@/constants/layout";
import React from "react";
import { StyleSheet, Text, Pressable } from "react-native";
import Animated from "react-native-reanimated";
import { usePressScale } from "@/hooks/useAnimations";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: PrimaryButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.97);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    backgroundColor: AppColors.primary,
    borderRadius: s(16),
    paddingVertical: vs(16),
    alignItems: "center",
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: AppColors.primaryLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: fs(16),
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
