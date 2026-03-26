import {
  AppColorsType,
  AppDarkColors,
  AppLightColors,
} from "@/constants/colors";
import React, { createContext, useContext, useState } from "react";
// language
import i18n from "@/i18n";

type Language = "en" | "ms" | "cn";

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
  const [savedDocuments, setSavedDocumentsState] = useState<SavedDocument[]>([
    {
      id: "1",
      name: "BE Form - John Doe",
      category: "tax_finance",
      document: "be_form",
      data: {
        icNumber: "000112-12-1235",
        fullName: "John Doe",
        dateOfBirth: "12/01/2000",
        maritalStatus: "Married",
        spouseIC: "001203-11-1254",
        spouseName: "Mary Louise",
        address: "15, Jalan Teknologi 1, Taman Teknologi Malaysia",
        postcode: "57000",
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      name: "Tax Return - John Doe",
      category: "tax_finance",
      document: "tax_return",
      data: {
        icNumber: "000112-12-1235",
        fullName: "John Doe",
        dateOfBirth: "12/01/2000",
        taxIdentificationNumber: "1233456625",
        bankAccountNumber: "1546548250649",
        nameOfBank: "Maybank",
        bankHolderName: "John Doe",
      },
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

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
