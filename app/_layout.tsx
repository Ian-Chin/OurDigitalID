import { AppProvider } from "@/context/AppContext";
import SplashScreen from "@/components/SplashScreen/SplashScreen";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import "react-native-reanimated";
import "@/i18n";
import "@/services/firebase";

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AppProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth/email" options={{ headerShown: false }} />
        <Stack.Screen name="auth/otp" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/personal-info"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="auth/scan-face" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="service" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="chatbot" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false, animation: "none" }} />

      </Stack>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <StatusBar style={showSplash ? "dark" : "auto"} />
    </AppProvider>
  );
}
