import { AlertBanner } from "@/components/AlertBanner/AlertBanner";
import SplashScreen from "@/components/SplashScreen/SplashScreen";
import { AppProvider } from "@/context/AppContext";
import { Stack } from "expo-router";
import React, { useState } from "react";

function RootNavigator() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="home" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="service" />
        <Stack.Screen name="chatbot" />
        <Stack.Screen name="gis" />
        <Stack.Screen name="notifications" />
      </Stack>
      <AlertBanner />
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootNavigator />
    </AppProvider>
  );
}
