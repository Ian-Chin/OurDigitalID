import {
  AppColorsType,
  AppDarkColors,
  AppLightColors,
} from "@/constants/colors";
import React, { createContext, useContext, useState } from "react";
// language
import i18n from "@/i18n";

type Language = "en" | "ms" | "cn";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  icNumber: string;
  address: string;
  mykadPhotoUrl: string;
}

export interface SavedDocument {
  id: string;
  name: string;
  category: string;
  document: string;
  data: SuggestedData;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestedData {
  [key: string]: string | undefined;
}

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

  // User Profile
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;

  // Saved Documents
  savedDocuments: SavedDocument[];
  setSavedDocuments: (docs: SavedDocument[]) => void;
  addSavedDocument: (doc: SavedDocument) => void;
  updateSavedDocument: (id: string, doc: Partial<SavedDocument>) => void;
  deleteSavedDocument: (id: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [elderlyMode, setElderlyMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [savedDocuments, setSavedDocumentsState] = useState<SavedDocument[]>([]);

  // [REMOVED] theme state — no longer needed
  // highContrast = dark mode
  const colors = highContrast ? AppDarkColors : AppLightColors;

  // [ADDED] sync i18n when language changes
  const handleSetLanguage = (value: Language) => {
    setLanguage(value);
    i18n.changeLanguage(value);
  };

  const addSavedDocument = (doc: SavedDocument) => {
    setSavedDocumentsState([...savedDocuments, doc]);
  };

  const updateSavedDocument = (id: string, updates: Partial<SavedDocument>) => {
    setSavedDocumentsState(
      savedDocuments.map((doc) =>
        doc.id === id
          ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
          : doc,
      ),
    );
  };

  const deleteSavedDocument = (id: string) => {
    setSavedDocumentsState(savedDocuments.filter((doc) => doc.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        elderlyMode,
        setElderlyMode,
        highContrast,
        setHighContrast,
        colors,
        language,
        setLanguage: handleSetLanguage,
        userProfile,
        setUserProfile,
        savedDocuments,
        setSavedDocuments: setSavedDocumentsState,
        addSavedDocument,
        updateSavedDocument,
        deleteSavedDocument,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
}
