import { AppText } from "@/components/common/AppText";
import { fs, s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { deleteDocumentFromFirestore } from "@/services/documentService";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    colors,
    elderlyMode,
    highContrast,
    savedDocuments,
    deleteSavedDocument,
    userProfile,
  } = useAppContext();
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh component when documents change
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, []),
  );

  const handleEdit = (docId: string) => {
    // Navigate to form-assistant with document ID
    router.push({
      pathname: "/profile/form-assistant",
      params: { docId },
    });
  };

  const handleDelete = (docId: string) => {
    Alert.alert(
      t("confirm") || "Confirm",
      t("deleteDocumentConfirm") ||
        "Are you sure you want to delete this document?",
      [
        {
          text: t("cancel") || "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: t("delete") || "Delete",
          onPress: () => {
            deleteSavedDocument(docId);
            deleteDocumentFromFirestore(docId).catch((err) =>
              console.warn("[profile] Firestore delete failed:", err),
            );
          },
          style: "destructive",
        },
      ],
    );
  };

  return (
    <View
      key={refreshKey}
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Digital ID Card Section */}
        {userProfile ? (
          <View style={styles.idCardWrapper}>
            <LinearGradient
              colors={["#1A56DB", "#2D7AED", "#4A90D9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.idCard}
            >
              <AppText
                size={fs(11)}
                style={styles.idCardBranding}
              >
                OurDigitalID
              </AppText>
              <View style={styles.idCardContent}>
                {userProfile.mykadPhotoUrl ? (
                  <Image
                    source={{ uri: userProfile.mykadPhotoUrl }}
                    style={styles.idCardPhoto}
                  />
                ) : (
                  <View style={[styles.idCardPhoto, { backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" }]}>
                    <Ionicons name="person" size={32} color="#FFF" />
                  </View>
                )}
                <View style={styles.idCardInfo}>
                  <AppText
                    size={fs(18)}
                    style={{ fontWeight: "700", color: "#FFF", marginBottom: 4 }}
                  >
                    {userProfile.fullName}
                  </AppText>
                  {userProfile.icNumber ? (
                    <AppText
                      size={fs(14)}
                      style={{ color: "rgba(255,255,255,0.85)", marginBottom: 4 }}
                    >
                      IC: {userProfile.icNumber}
                    </AppText>
                  ) : null}
                  <AppText
                    size={fs(12)}
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    {userProfile.email}
                  </AppText>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.setupCard,
              {
                marginHorizontal: 16,
                marginVertical: 24,
                backgroundColor: colors.backgroundGrouped,
                borderRadius: 12,
                borderColor: highContrast ? colors.border : "transparent",
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
            onPress={() => router.push("/auth/create-digital-id")}
            activeOpacity={0.7}
          >
            <Ionicons name="id-card-outline" size={40} color={colors.primary} />
            <AppText
              size={fs(16)}
              style={{ fontWeight: "600", color: colors.textPrimary, marginTop: 12 }}
            >
              Set up your Digital ID
            </AppText>
            <AppText
              size={fs(13)}
              style={{ color: colors.textSecondary, marginTop: 6, textAlign: "center" }}
            >
              Create your Digital ID to access all services
            </AppText>
          </TouchableOpacity>
        )}

        {/* Your Saved Documents Section */}
        <View style={{ marginHorizontal: 16 }}>
          <AppText
            size={fs(20)}
            style={[
              styles.sectionTitle,
              {
                fontWeight: "700",
                color: colors.textPrimary,
                marginBottom: 16,
              },
            ]}
          >
            {t("yourSavedDocuments")}
          </AppText>

          {/* Documents List */}
          <View style={styles.documentsList}>
            {savedDocuments.length === 0 ? (
              <AppText
                size={fs(14)}
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  paddingVertical: 20,
                }}
              >
                {t("noDocumentsSaved") || "No documents saved yet"}
              </AppText>
            ) : (
              savedDocuments.map((doc) => (
                <View
                  key={doc.id}
                  style={[
                    styles.documentItem,
                    {
                      backgroundColor: colors.backgroundGrouped,
                      borderRadius: 10,
                      marginBottom: 12,
                      borderColor: highContrast ? colors.border : "transparent",
                      borderWidth: highContrast ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.documentInfo}>
                    <AppText
                      size={fs(16)}
                      style={[
                        styles.documentName,
                        {
                          fontWeight: "600",
                          color: colors.textPrimary,
                        },
                      ]}
                    >
                      {doc.name}
                    </AppText>
                    <AppText
                      size={fs(12)}
                      style={{
                        color: colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      {t("lastUpdated") || "Last updated"}:{" "}
                      {new Date(doc.updatedAt).toLocaleDateString()}
                    </AppText>
                  </View>

                  <View style={styles.documentActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#A8D5FF" },
                      ]}
                      onPress={() => handleEdit(doc.id)}
                      activeOpacity={0.6}
                    >
                      <AppText
                        size={fs(13)}
                        style={[
                          styles.actionButtonText,
                          {
                            fontWeight: "600",
                            color: "#0066CC",
                          },
                        ]}
                      >
                        {t("edit")}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        { backgroundColor: "#FFB3B3", marginLeft: 8 },
                      ]}
                      onPress={() => handleDelete(doc.id)}
                      activeOpacity={0.6}
                    >
                      <AppText
                        size={fs(13)}
                        style={[
                          styles.actionButtonText,
                          {
                            fontWeight: "600",
                            color: "#CC0000",
                          },
                        ]}
                      >
                        {t("delete")}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  headerTitle: {
    fontWeight: "700",
  },
  notificationButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  idCardWrapper: {
    marginHorizontal: 16,
    marginVertical: 24,
  },
  idCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 160,
  },
  idCardBranding: {
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  idCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  idCardPhoto: {
    width: 72,
    height: 72,
    borderRadius: 10,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  idCardInfo: {
    flex: 1,
  },
  setupCard: {
    padding: 24,
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: 4,
  },
  documentsList: {
    marginBottom: 20,
  },
  documentItem: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontWeight: "600",
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedText: {
    fontWeight: "500",
  },
  documentActions: {
    flexDirection: "row",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontWeight: "600",
  },
  addDocumentButton: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  addDocumentText: {
    fontWeight: "600",
  },
});
