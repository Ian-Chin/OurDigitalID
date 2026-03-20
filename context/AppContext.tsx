import React, { createContext, useContext, useState } from 'react';
import { AppColorsType, AppLightColors, AppDarkColors } from '@/constants/colors';

type Theme = 'light' | 'dark';
//language options, default english
type Language = 'en' | 'ms';

type AppContextType = {
  // Elderly Mode
  elderlyMode: boolean;
  setElderlyMode: (value: boolean) => void;

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
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');

  const colors = theme === 'dark' ? AppDarkColors : AppLightColors;

  return (
    <AppContext.Provider value={{
      elderlyMode, setElderlyMode,
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