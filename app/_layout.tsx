// IMPORTANT: keep this side-effect import first so Dimensions.get('window')
// is patched before any other module reads it on web.
import "@/utils/webDimensions";

import { AlertBanner } from "@/components/AlertBanner/AlertBanner";
import PortraitFrame from "@/components/platform/PortraitFrame";
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
    <PortraitFrame>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </PortraitFrame>
  );
}
