import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { AppColors } from '@/constants/colors';
import { vs, fs } from '@/constants/layout';

const APP_VERSION = '1.0.0';

interface VersionFooterProps {
  color?: string;
}

export function VersionFooter({ color = AppColors.textSecondary }: VersionFooterProps) {
  return (
    <Text style={[styles.versionText, { color }]}>
      OurDigitalID {APP_VERSION}
    </Text>
  );
}

const styles = StyleSheet.create({
  versionText: {
    fontSize: fs(12),
    textAlign: 'center',
    paddingBottom: vs(24),
  },
});
