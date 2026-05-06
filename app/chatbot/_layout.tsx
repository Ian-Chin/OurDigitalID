import { Stack } from "expo-router";

export default function ChatbotLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 220,
      }}
    />
  );
}
