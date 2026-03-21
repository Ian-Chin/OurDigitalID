import NavigationButton from "@/components/NavigationButton/navigation-button";
import { NotificationButton } from "@/components/NotificationButton/Notification-button";
import { Stack } from "expo-router";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppointmentLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
      >
        <Stack.Screen
          name="appointment"
          options={{ headerShown: false }}
        />
      </Stack>

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
    paddingTop: 16,
    paddingBottom: 16,
  },
});
