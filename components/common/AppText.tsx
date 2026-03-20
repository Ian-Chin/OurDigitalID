import React from 'react';
import { Text, TextProps } from 'react-native';
import { useAppContext } from '@/context/AppContext';
import { fs, ELDERLY_FONT_SCALE } from '@/constants/layout';

interface AppTextProps extends TextProps {
  size: number;
}

export function AppText({ size, style, children, ...props }: AppTextProps) {
  const { elderlyMode, colors } = useAppContext();

  const fontSize = elderlyMode
    ? Math.round(fs(size) * ELDERLY_FONT_SCALE)
    : fs(size);

  return (
    <Text
      style={[{ fontSize, color: colors.textPrimary }, style]}
      {...props}
    >
      {children}
    </Text>
  );
}