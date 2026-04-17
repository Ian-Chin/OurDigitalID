import {
  AppColorsType,
  AppDarkColors,
  AppLightColors,
} from "@/constants/colors";
import React, { createContext, useContext, useEffect, useState } from "react";
// language
import i18n from "@/i18n";
import {
  fetchUserDocuments,
  deleteDocumentFromFirestore,
} from "@/services/documentService";

type Language = "en" | "ms" | "cn";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  icNumber: string;
  address: string;
  mykadPhotoUrl: string;
}

export interface DocumentVerification {
  isValid: boolean;
  score: number;
  issues: string[];
  verifiedAt: string;
}

export interface SavedDocument {
  id: string;
  name: string;
  category: string;
  document: string;
  data: SuggestedData;
  createdAt: string;
  updatedAt: string;
  verification?: DocumentVerification;
}

export interface SuggestedData {
  [key: string]: string | undefined;
}

export interface AppNotification {
  id: string;
  type: "user" | "system" | "success" | "alert";
  userName?: string;
  message: string;
  isRead: boolean;
  time: string;
  avatarUrl?: string;
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

  // Notifications
  notifications: AppNotification[];
  addNotification: (
    notification: Omit<AppNotification, "id" | "isRead" | "time"> & {
      isRead?: boolean;
      time?: string;
    },
  ) => void;
  markNotificationAsRead: (id: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [elderlyMode, setElderlyMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLanguage] = useState<Language>("en");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [savedDocuments, setSavedDocumentsState] = useState<SavedDocument[]>(
    [],
  );
  const [documentsLoaded, setDocumentsLoaded] = useState(false);

  // Sync saved documents from Firestore when user logs in
  useEffect(() => {
    if (!userProfile?.uid) {
      setSavedDocumentsState([]);
      setDocumentsLoaded(false);
      return;
    }
    let cancelled = false;
    fetchUserDocuments(userProfile.uid)
      .then((docs) => {
        if (!cancelled) {
          setSavedDocumentsState(docs);
          setDocumentsLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch saved documents:", err);
        if (!cancelled) setDocumentsLoaded(true);
      });
    return () => { cancelled = true; };
  }, [userProfile?.uid]);
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: "1",
      type: "success",
      message: "Your MyKad renewal application has been approved",
      isRead: true,
      time: "Just now",
    },
    {
      id: "2",
      type: "alert",
      message: "Alert: Maintenance on government portal from 2 AM - 4 AM",
      isRead: false,
      time: "30m ago",
    },
    {
      id: "3",
      type: "system",
      message: "New driver's license batch processing available. Apply now.",
      isRead: false,
      time: "1h ago",
    },
    {
      id: "4",
      type: "success",
      message:
        "Your passport application status: Ready for collection at JPJ office",
      isRead: true,
      time: "2h ago",
    },
    {
      id: "5",
      type: "alert",
      message:
        "Road closure alert: Jalan Raja Chulan closed tomorrow 9 AM - 5 PM",
      isRead: false,
      time: "3h ago",
    },
    {
      id: "6",
      type: "system",
      message: "Reminder: Your vehicle road tax expires on 30 March 2026",
      isRead: false,
      time: "4h ago",
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
    deleteDocumentFromFirestore(id).catch((err) =>
      console.error("Failed to delete document from Firestore:", err),
    );
  };

  const addNotification: AppContextType["addNotification"] = (notification) => {
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        isRead: notification.isRead ?? false,
        time: notification.time ?? "Just now",
        ...notification,
      },
      ...prev,
    ]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
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
        notifications,
        addNotification,
        markNotificationAsRead,
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
