import { AppIcon } from "@/components/common/AppIcon";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

export const NotificationButton = () => {
  const { colors } = useAppContext();
  const router = useRouter();
  const handleActionPress = (routePath: string) => {
    router.push(routePath as any);
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationButton,
        { backgroundColor: colors.notifButtonBg },
      ]}
      onPress={() => handleActionPress("/notifications/notifications")}
    >
      <AppIcon name="bell.fill" size={24} color={colors.textPrimary} />
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
  },
});
