import { AppIcon } from "@/components/common/AppIcon";
import { Elevation } from "@/constants/colors";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface NotificationButtonProps {
  hasUnread?: boolean;
  variant?: "light" | "onDark";
}

export const NotificationButton = ({
  hasUnread = true,
  variant = "light",
}: NotificationButtonProps) => {
  const { colors } = useAppContext();
  const router = useRouter();

  const onDark = variant === "onDark";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.notificationButton,
        {
          backgroundColor: onDark
            ? "rgba(255,255,255,0.12)"
            : colors.backgroundElevated,
          borderColor: onDark ? "rgba(255,255,255,0.18)" : colors.borderLight,
          ...Elevation.sm,
          shadowColor: colors.shadowDark,
        },
      ]}
      onPress={() => router.push("/notifications/notifications" as any)}
    >
      <AppIcon
        name="bell.fill"
        size={20}
        color={onDark ? "#FFFFFF" : colors.textPrimary}
      />
      {hasUnread && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.notifBadge,
              borderColor: onDark ? "#0B1F3A" : colors.backgroundElevated,
            },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
