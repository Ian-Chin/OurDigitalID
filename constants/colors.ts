// ─────────────────────────────────────────────────────────────────────────────
// Civic Modern — design tokens
//
// Deep ink navy as the sovereign primary, electric cyan as interactive accent,
// warm amber for civic warmth. Cream surfaces instead of pure white so cards
// read as elevated. Existing keys preserved for downstream consumers.
// ─────────────────────────────────────────────────────────────────────────────

const lightColors = {
  // Primary
  primary: "#0B1F3A",          // Deep ink navy
  primaryLight: "#3B5A8A",
  primarySoft: "#E8EEF8",

  // Accent (interactive / focus)
  accent: "#06B6D4",           // Electric cyan
  accentSoft: "#CFFAFE",
  accentDeep: "#0891B2",

  // Highlight
  highlight: "#F59E0B",        // Warm amber
  highlightSoft: "#FEF3C7",

  // Text
  textPrimary: "#0B1220",
  textSecondary: "#5C6473",
  textPlaceholder: "#9AA0AC",
  textMuted: "#6B7280",
  textOnPrimary: "#FFFFFF",

  // Backgrounds
  background: "#FAFAF7",
  backgroundElevated: "#FFFFFF",
  backgroundGrouped: "#F1F2EE",
  backgroundDark: "#1A1F2C",
  backgroundDarkAlt: "#252B38",

  // Borders & Separators
  border: "#E2E2DA",
  borderLight: "#ECECE6",
  separator: "#D4D4CC",

  // Status
  success: "#10B981",
  successSoft: "#D1FAE5",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  error: "#EF4444",
  errorSoft: "#FEE2E2",

  // Specific UI
  notifBadge: "#EF4444",
  notifButtonBg: "#F1F2EE",
  shadowDark: "#0B1220",

  // Support option colors
  supportVoiceBg: "#E0F7FA",
  supportVoiceBorder: "#06B6D4",
  supportLargeTextBg: "#FEF2F2",
  supportLargeTextBorder: "#FCA5A5",
  supportAutoScrollBg: "#FEF3C7",
  supportAutoScrollBorder: "#F59E0B",
};

const darkColors = {
  // Primary
  primary: "#7DD3FC",
  primaryLight: "#BAE6FD",
  primarySoft: "#0E2540",

  // Accent
  accent: "#22D3EE",
  accentSoft: "#0E3B45",
  accentDeep: "#67E8F9",

  // Highlight
  highlight: "#FBBF24",
  highlightSoft: "#3B2F0E",

  // Text
  textPrimary: "#F4F5F7",
  textSecondary: "#9CA3AF",
  textPlaceholder: "#6B7280",
  textMuted: "#A1A8B5",
  textOnPrimary: "#0B1220",

  // Backgrounds
  background: "#0F141C",
  backgroundElevated: "#161C26",
  backgroundGrouped: "#1A2230",
  backgroundDark: "#252B38",
  backgroundDarkAlt: "#2F3645",

  // Borders & Separators
  border: "#2A3242",
  borderLight: "#222A38",
  separator: "#2A3242",

  // Status
  success: "#34D399",
  successSoft: "#06281C",
  warning: "#FBBF24",
  warningSoft: "#3B2F0E",
  error: "#F87171",
  errorSoft: "#3B1414",

  // Specific UI
  notifBadge: "#F87171",
  notifButtonBg: "#1A2230",
  shadowDark: "#000000",

  // Support option colors
  supportVoiceBg: "#0E3B45",
  supportVoiceBorder: "#22D3EE",
  supportLargeTextBg: "#3B1414",
  supportLargeTextBorder: "#F87171",
  supportAutoScrollBg: "#3B2F0E",
  supportAutoScrollBorder: "#FBBF24",
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
  textSecondary: "#D1D5DB",
  textPlaceholder: "#9CA3AF",
  textMuted: "#B3B9C4",
  textOnPrimary: "#0B1220",
  background: "#0B1220",
  backgroundElevated: "#0F1726",
  backgroundGrouped: "#000000",
  border: "#FFFFFF",
  borderLight: "#3F4756",
  separator: "#3F4756",
  primary: "#22D3EE",
  accent: "#FBBF24",
};

// ─────────────────────────────────────────────────────────────────────────────
// Gradient & motion tokens
// ─────────────────────────────────────────────────────────────────────────────
export const Gradients = {
  hero: ["#0B1F3A", "#13335A", "#1B4F8A"] as const,
  heroDark: ["#0B1220", "#13335A", "#0E2540"] as const,
  cyan: ["#06B6D4", "#0891B2"] as const,
  amber: ["#F59E0B", "#D97706"] as const,
  cream: ["#FAFAF7", "#F1F2EE"] as const,
  glow: ["rgba(6,182,212,0)", "rgba(6,182,212,0.18)"] as const,
};

// Layered shadow presets — apply via spread
export const Elevation = {
  sm: {
    shadowColor: "#0B1220",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#0B1220",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
  },
  lg: {
    shadowColor: "#0B1220",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 14,
  },
};

// Border radius scale
export const Radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
};
