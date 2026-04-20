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
  type: "user" | "system" | "success" | "alert" | "weather" | "queue" | "document" | "flood" | "earthquake";
  userName?: string;
  message: string;
  isRead: boolean;
  time: string;
  timestamp: string; // ISO 8601 string for sorting/grouping
  avatarUrl?: string;
  screen?: string; // deep-link target (e.g. "/gis/gis", "/service/service-page")
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
    notification: Omit<AppNotification, "id" | "isRead" | "time" | "timestamp"> & {
      isRead?: boolean;
      time?: string;
      timestamp?: string;
    },
  ) => void;
  markNotificationAsRead: (id: string) => void;

  // Active Alert (top-of-screen popup banner)
  activeAlert: ActiveAlert | null;
  triggerAlert: (alert: ActiveAlert) => void;
  dismissAlert: () => void;
};

export type AlertKind = "flood" | "earthquake" | "weather";

export interface ActiveAlert {
  kind: AlertKind;
  title: string;
  body: string;
}

/** Compute a human-readable relative time string from an ISO timestamp. */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  if (diffMs < 60_000) return "Just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);

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
    const now = new Date();
    const ts = notification.timestamp ?? now.toISOString();
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        isRead: notification.isRead ?? false,
        time: notification.time ?? formatRelativeTime(ts),
        timestamp: ts,
        ...notification,
      },
      ...prev,
    ]);
  };

  const triggerAlert = (alert: ActiveAlert) => {
    setActiveAlert(alert);
    const now = new Date();
    setNotifications((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: alert.kind,
        message: alert.body,
        userName: alert.title,
        isRead: false,
        time: formatRelativeTime(now.toISOString()),
        timestamp: now.toISOString(),
      },
      ...prev,
    ]);
  };

  const dismissAlert = () => setActiveAlert(null);

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
        activeAlert,
        triggerAlert,
        dismissAlert,
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
