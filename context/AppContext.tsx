import React, { createContext, useContext, useState } from 'react';
// [CHANGED] Added AppHighContrastColors import
import { AppColorsType, AppLightColors, AppDarkColors, AppHighContrastColors } from '@/constants/colors';

type Theme = 'light' | 'dark';
//language options, default english
type Language = 'en' | 'ms';

type AppContextType = {
  // Elderly Mode
  elderlyMode: boolean;
  setElderlyMode: (value: boolean) => void;

  // [ADDED] High Contrast Mode
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;

  // Theme
  theme: Theme;
  setTheme: (value: Theme) => void;
  colors: AppColorsType;

  // Language
  language: Language;
  setLanguage: (value: Language) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [elderlyMode, setElderlyMode] = useState(false);
  // [ADDED] highContrast state
  const [highContrast, setHighContrast] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');

  // [CHANGED] colors now considers highContrast first, then theme
  const colors = highContrast
    ? AppHighContrastColors
    : theme === 'dark' ? AppDarkColors : AppLightColors;

  return (
    <AppContext.Provider value={{
      elderlyMode, setElderlyMode,
      highContrast, setHighContrast, // [ADDED]
      theme, setTheme, colors,
      language, setLanguage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}