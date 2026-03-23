const lightColors = {
  // Primary
  primary: "#2196F3",
  primaryLight: "#90CAF9",

  // Text
  textPrimary: "#1C1C1E",
  textSecondary: "#8E8E93",
  textPlaceholder: "#AEAEB2",
  textMuted: "#6B6B6B",

  // Backgrounds
  background: "#FFFFFF",
  backgroundGrouped: "#F2F2F7",
  backgroundDark: "#3A3A3C",
  backgroundDarkAlt: "#4A4A4C",

  // Borders & Separators
  border: "#D1D1D6",
  borderLight: "#E5E5EA",
  separator: "#C7C7CC",

  // Status
  success: "#4CAF50",
  error: "#FF3B30",

  // Specific UI
  notifBadge: "#FF3B30",
  notifButtonBg: "#F2F2F7",
  shadowDark: "#000",

  // Support option colors
  supportVoiceBg: "#EAF4FB",
  supportVoiceBorder: "#90CAF9",
  supportLargeTextBg: "#FDEDED",
  supportLargeTextBorder: "#EF9A9A",
  supportAutoScrollBg: "#FFFDE7",
  supportAutoScrollBorder: "#FFE082",
};

const darkColors = {
  // Primary
  primary: "#2196F3",
  primaryLight: "#90CAF9",

  // Text
  textPrimary: "#F2F2F7",
  textSecondary: "#8E8E93",
  textPlaceholder: "#6B6B6B",
  textMuted: "#AEAEB2",

  // Backgrounds
  background: "#1C1C1E",
  backgroundGrouped: "#2C2C2E",
  backgroundDark: "#3A3A3C",
  backgroundDarkAlt: "#4A4A4C",

  // Borders & Separators
  border: "#3A3A3C",
  borderLight: "#2C2C2E",
  separator: "#3A3A3C",

  // Status
  success: "#4CAF50",
  error: "#FF3B30",

  // Specific UI
  notifBadge: "#FF3B30",
  notifButtonBg: "#2C2C2E",
  shadowDark: "#000",

  // Support option colors
  supportVoiceBg: "#1A2F3F",
  supportVoiceBorder: "#2196F3",
  supportLargeTextBg: "#3F1A1A",
  supportLargeTextBorder: "#EF9A9A",
  supportAutoScrollBg: "#3F3A1A",
  supportAutoScrollBorder: "#FFE082",
};

export type AppColorsType = typeof lightColors;
export const AppLightColors = lightColors;
export const AppDarkColors = darkColors;

// fallback — so existing code using AppColors doesn't break ✅
export const AppColors = lightColors;

// Settings - High contrast color set
export const AppHighContrastColors: AppColorsType = {
  ...AppLightColors,
  textPrimary: "#FFFFFF",
  textSecondary: "#CCCCCC",
  textPlaceholder: "#999999",
  textMuted: "#AAAAAA",
  background: "#1C1C1E",
  backgroundGrouped: "#000000",
  border: "#FFFFFF",
  borderLight: "#444444",
  separator: "#444444",
  primary: "#2196F3",
};
