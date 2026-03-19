import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/colors';
import { s, vs } from '@/constants/layout';

interface CenterLogoButtonProps {
  onPress?: (e: GestureResponderEvent) => void;
}

function CenterLogoButton({ onPress }: CenterLogoButtonProps) {
  return (
    <View style={styles.centerButtonWrapper}>
      <TouchableOpacity style={styles.centerButton} onPress={onPress} activeOpacity={0.85}>
        <Image
          source={require('../../assets/images/logo_small.png')}
          style={styles.centerLogo}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

export default function HomeLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.textSecondary,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="logo"
        options={{
          tabBarButton: (props) => (
            <CenterLogoButton onPress={props.onPress} />
          ),
        }}
      />
      <Tabs.Screen
        name="service"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: vs(24),
    left: s(56),
    right: s(56),
    height: vs(64),
    borderRadius: s(32),
    backgroundColor: AppColors.background,
    borderTopWidth: 0,
    shadowColor: AppColors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    paddingHorizontal: s(8),
    paddingTop: vs(12),
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    top: vs(-10),
    width: s(64),
    height: s(64),
    borderRadius: s(32),
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  centerLogo: {
    width: s(36),
    height: s(36),
    tintColor: AppColors.background,
  },
});
