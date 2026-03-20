import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const BASE_WIDTH = 375; // iPhone 11/12/13 reference
const BASE_HEIGHT = 812;

/** Horizontal scale — margins, paddings, widths, border radii, icon sizes, gaps */
export const s = (size: number): number => Math.round((width / BASE_WIDTH) * size);

/** Vertical scale — heights, vertical margins, top/bottom positions */
export const vs = (size: number): number => Math.round((height / BASE_HEIGHT) * size);

/** Font scale — clamped 85%–120% to stay readable */
export const fs = (size: number): number => {
  const scale = width / BASE_WIDTH;
  const clamped = Math.min(Math.max(scale, 0.85), 1.2);
  return Math.round(size * clamped);
};

// Elderly scales
export const ELDERLY_FONT_SCALE = 1.5;
export const ELDERLY_ICON_SCALE = 1.25;