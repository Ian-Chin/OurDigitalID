import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { s, ELDERLY_ICON_SCALE } from '@/constants/layout';
import { IconSymbol } from '@/components/ui/icon-symbol'; // icon existing

interface AppIconProps {
  name: string;
  size: number;
  color?: string;
}

export function AppIcon({ name, size, color }: AppIconProps) {
  const { elderlyMode, colors } = useAppContext();

  const iconSize = elderlyMode
    ? Math.round(s(size) * ELDERLY_ICON_SCALE)
    : s(size);

  return (
    <IconSymbol
      name={name as any}
      size={iconSize}
      color={color ?? colors.textPrimary}
    />
  );
}