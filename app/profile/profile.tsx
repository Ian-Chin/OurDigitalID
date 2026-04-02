import { AppText } from "@/components/common/AppText";
import { fs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
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
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleAddDocument = () => {
    // Navigate to form-assistant for creating a new document
    router.push("/profile/form-assistant");
  };

  const handleTryNow = () => {
    // Navigate to AI form assistant
    router.push("/profile/form-assistant");
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
        {/* Personal Data Assistant Section */}
        <View
          style={[
            styles.assistantSection,
            {
              marginHorizontal: 16,
              marginVertical: 24,
              backgroundColor: colors.backgroundGrouped,
              borderRadius: 12,
              borderColor: highContrast ? colors.border : "transparent",
              borderWidth: highContrast ? 2 : 1,
            },
          ]}
        >
          <View style={styles.assistantContent}>
            <View style={styles.assistantText}>
              <AppText
                size={fs(20)}
                style={[
                  styles.assistantTitle,
                  {
                    fontWeight: "700",
                    color: colors.textPrimary,
                  },
                ]}
              >
                {t("personalDataAssistant")}
              </AppText>
              <AppText
                size={fs(14)}
                style={[
                  styles.assistantDescription,
                  {
                    color: colors.textSecondary,
                    marginTop: 8,
                  },
                ]}
              >
                {t("prepareYourFormData")}
              </AppText>
            </View>
            {/* This could be an image - for now using placeholder */}
            <View
              style={[
                styles.assistantImage,
                { backgroundColor: colors.border },
              ]}
            >
              <Ionicons
                name="document-text"
                size={48}
                color={colors.textSecondary}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.tryNowButton,
              { backgroundColor: "#B8A2FF" },
              highContrast && {
                borderWidth: 2,
                borderColor: colors.primary,
                backgroundColor: colors.background,
              },
            ]}
            onPress={handleTryNow}
            activeOpacity={0.7}
          >
            <AppText
              size={fs(15)}
              style={[
                styles.tryNowButtonText,
                {
                  fontWeight: "600",
                  color: highContrast ? colors.primary : "#FFFFFF",
                },
              ]}
            >
              {t("tryNow")}
            </AppText>
          </TouchableOpacity>
        </View>

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

          {/* Add More Document Button */}
          <TouchableOpacity
            style={[
              styles.addDocumentButton,
              {
                backgroundColor: colors.backgroundGrouped,
                borderColor: colors.border,
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
            onPress={handleAddDocument}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add-circle-outline"
              size={elderlyMode ? 24 : 28}
              color={colors.textPrimary}
            />
            <AppText
              size={fs(16)}
              style={[
                styles.addDocumentText,
                {
                  fontWeight: "600",
                  color: colors.textPrimary,
                  marginLeft: 12,
                },
              ]}
            >
              {t("addMoreDocument")}
            </AppText>
          </TouchableOpacity>
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
  assistantSection: {
    padding: 16,
    overflow: "hidden",
  },
  assistantContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  assistantText: {
    flex: 1,
    marginRight: 12,
  },
  assistantTitle: {
    marginBottom: 4,
  },
  assistantDescription: {
    lineHeight: 20,
  },
  assistantImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  tryNowButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tryNowButtonText: {
    fontWeight: "600",
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
