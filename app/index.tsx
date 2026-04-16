import { useAppContext } from "@/context/AppContext";
import { auth, db } from "@/services/firebase";
import { fetchUserDocuments } from "@/services/documentService";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { setUserProfile, setSavedDocuments } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileDoc = await getDoc(doc(db, "users", user.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            setUserProfile({
              uid: user.uid,
              email: data.email || user.email || "",
              fullName: data.fullName || "",
              icNumber: data.icNumber || "",
              address: data.address || "",
              mykadPhotoUrl: data.mykadPhotoUrl || "",
            });
          }
          // Load saved documents
          try {
            const docs = await fetchUserDocuments(user.uid);
            setSavedDocuments(docs);
          } catch (docErr) {
            console.warn("[index] Failed to load documents:", docErr);
          }
        } catch (err) {
          console.warn("[index] Failed to load profile:", err);
        }
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return loggedIn ? (
    <Redirect href="/home/Home" />
  ) : (
    <Redirect href="/onboarding/showcase" />
  );
}
