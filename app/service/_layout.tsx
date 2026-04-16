import NavigationButton from "@/components/NavigationButton/navigation-button";
import { NotificationButton } from "@/components/NotificationButton/Notification-button";
import { useAppContext } from "@/context/AppContext";
import { Stack } from "expo-router";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppointmentLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/ourdigitalID.png")}
          style={{ width: 150, height: 40, resizeMode: "contain" }}
        />
        <View style={{ flex: 1 }} />
        <NotificationButton />
      </View>

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />

      {/* This is your new custom navigation bar */}
      <NavigationButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
});
