import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import NavigationButton from '@/components/NavigationButton/navigation-button';

export default function HomeLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Hides the old default tab bar completely
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="service" />
        <Tabs.Screen name="settings" />
        {/* We removed the old "logo" dummy screen since the new bar handles the center button natively */}
      </Tabs>
      
      {/* This is your new custom navigation bar */}
      <NavigationButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});