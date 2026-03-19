import { Redirect } from 'expo-router';

export default function Index() {
  const isLoggedIn = false; // replace with real auth check later

  return isLoggedIn ? (
    <Redirect href="/(tabs)" />
  ) : (
    <Redirect href="/onboarding/language" />
  );
}