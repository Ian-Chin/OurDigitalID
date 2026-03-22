import React, { createContext, useContext, useState } from 'react';
import { AppColorsType, AppLightColors, AppDarkColors } from '@/constants/colors';
// language
import i18n from '@/i18n';

type Language = 'en' | 'ms' | 'cn';

type AppContextType = {
  // Elderly Mode
  elderlyMode: boolean;
  setElderlyMode: (value: boolean) => void;

  // High Contrast Mode (= Dark Mode)
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;

  // Colors
  colors: AppColorsType;

  // Language
  language: Language;
  setLanguage: (value: Language) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [elderlyMode, setElderlyMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  // [REMOVED] theme state — no longer needed
  // highContrast = dark mode
  const colors = highContrast ? AppDarkColors : AppLightColors;

  // [ADDED] sync i18n when language changes
  const handleSetLanguage = (value: Language) => {
    setLanguage(value);
    i18n.changeLanguage(value);
  };

  return (
    <AppContext.Provider value={{
      elderlyMode, setElderlyMode,
      highContrast, setHighContrast,
      colors,
      language, setLanguage: handleSetLanguage,
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