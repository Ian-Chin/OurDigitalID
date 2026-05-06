import { AppText } from "@/components/common/AppText";
import { Elevation, Gradients, Radii } from "@/constants/colors";
import { fs, s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { deleteDocumentFromFirestore } from "@/services/documentService";
import { showConfirm } from "@/utils/webAlert";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

const DocumentCard = memo(
  ({
    doc,
    colors,
    onEdit,
    onDelete,
    t,
  }: {
    doc: any;
    colors: any;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    t: any;
  }) => (
    <View
      style={[
        styles.documentItem,
        {
          backgroundColor: colors.backgroundElevated,
          borderColor: colors.borderLight,
        },
        Elevation.sm,
        { shadowColor: "#0B1220" },
      ]}
    >
      <View style={[styles.docIconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="document-text" size={18} color={colors.primary} />
      </View>
      <View style={styles.documentInfo}>
        <AppText
          size={fs(15)}
          style={{ fontWeight: "700", color: colors.textPrimary }}
          numberOfLines={1}
        >
          {doc.name}
        </AppText>
        <AppText
          size={fs(11)}
          style={{ color: colors.textSecondary, marginTop: 3 }}
        >
          {t("lastUpdated") || "Updated"} ·{" "}
          {new Date(doc.updatedAt).toLocaleDateString()}
        </AppText>
      </View>
      <View style={styles.documentActions}>
        <Pressable
          onPress={() => onEdit(doc.id)}
          style={({ pressed }) => [
            styles.iconActionBtn,
            { backgroundColor: colors.accentSoft, opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={6}
        >
          <Ionicons name="create-outline" size={16} color="#0891B2" />
        </Pressable>
        <Pressable
          onPress={() => onDelete(doc.id)}
          style={({ pressed }) => [
            styles.iconActionBtn,
            { backgroundColor: colors.errorSoft, opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={6}
        >
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </Pressable>
      </View>
    </View>
  ),
);

export default function ProfileScreen() {
  const router = useRouter();
  const {
    colors,
    highContrast,
    savedDocuments,
    deleteSavedDocument,
    userProfile,
  } = useAppContext();
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((p) => p + 1);
    }, []),
  );

  const handleEdit = useCallback(
    (docId: string) => {
      router.push({ pathname: "/profile/form-assistant", params: { docId } });
    },
    [router],
  );

  const handleDelete = useCallback(
    (docId: string) => {
      showConfirm(
        t("confirm") || "Confirm",
        t("deleteDocumentConfirm") ||
          "Are you sure you want to delete this document?",
        [
          { text: t("cancel") || "Cancel", style: "cancel" },
          {
            text: t("delete") || "Delete",
            style: "destructive",
            onPress: () => {
              deleteSavedDocument(docId);
              deleteDocumentFromFirestore(docId).catch(() => {});
            },
          },
        ],
      );
    },
    [deleteSavedDocument, t],
  );

  const handleAddDocument = useCallback(() => {
    router.push("/profile/form-assistant");
  }, [router]);

  const handleDocumentScan = useCallback(() => {
    router.push("/service/scan" as any);
  }, [router]);

  const cardAnim = useFadeInUp(stagger(0, 80));
  const scanAnim = useFadeInUp(stagger(1, 80));
  const titleAnim = useFadeInUp(stagger(2, 80));
  const docsAnim = useFadeInUp(stagger(3, 80));

  return (
    <View
      key={refreshKey}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        removeClippedSubviews
      >
        {/* Digital ID Card */}
        {userProfile ? (
          <Animated.View style={[styles.idCardWrapper, cardAnim]}>
            <LinearGradient
              colors={Gradients.hero as unknown as string[]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.idCard, Elevation.lg, { shadowColor: "#0B1F3A" }]}
            >
              <View style={styles.orbA} pointerEvents="none" />
              <View style={styles.orbB} pointerEvents="none" />

              <View style={styles.idTopRow}>
                <View style={styles.idCrest}>
                  <Ionicons name="shield-checkmark" size={14} color="#06B6D4" />
                </View>
                <AppText size={fs(10)} style={styles.idCardBranding}>
                  OurDigitalID · MyKad-linked
                </AppText>
              </View>

              <View style={styles.idCardContent}>
                <View style={styles.idCardAvatar}>
                  <Ionicons name="person" size={32} color="#FFF" />
                </View>
                <View style={styles.idCardInfo}>
                  <AppText
                    size={fs(18)}
                    style={{
                      fontWeight: "800",
                      color: "#FFF",
                      letterSpacing: -0.3,
                    }}
                    numberOfLines={2}
                  >
                    {userProfile.fullName}
                  </AppText>
                  {userProfile.icNumber ? (
                    <AppText
                      size={fs(12)}
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        marginTop: 4,
                        letterSpacing: 0.4,
                      }}
                    >
                      IC · {userProfile.icNumber}
                    </AppText>
                  ) : null}
                  <AppText
                    size={fs(11)}
                    style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {userProfile.email}
                  </AppText>
                </View>
              </View>

              {userProfile.address ? (
                <View style={styles.idAddressRow}>
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color="rgba(255,255,255,0.7)"
                  />
                  <AppText
                    size={fs(11)}
                    style={{
                      color: "rgba(255,255,255,0.78)",
                      marginLeft: 6,
                      flex: 1,
                    }}
                    numberOfLines={2}
                  >
                    {userProfile.address}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.idBottomRow}>
                <View style={styles.verifyChip}>
                  <View style={styles.verifyDot} />
                  <AppText
                    size={10}
                    style={{
                      color: "#A7F3D0",
                      fontWeight: "700",
                      letterSpacing: 1.2,
                    }}
                  >
                    VERIFIED
                  </AppText>
                </View>
                <AppText
                  size={10}
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    letterSpacing: 1.4,
                    fontWeight: "600",
                  }}
                >
                  TAP TO EXPAND
                </AppText>
              </View>
            </LinearGradient>
          </Animated.View>
        ) : (
          <Animated.View style={cardAnim}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push("/auth/create-digital-id")}
              style={[
                styles.setupCard,
                {
                  backgroundColor: colors.backgroundElevated,
                  borderColor: highContrast ? colors.border : colors.borderLight,
                },
                Elevation.md,
                { shadowColor: "#0B1220" },
              ]}
            >
              <View style={[styles.setupIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="id-card" size={28} color={colors.primary} />
              </View>
              <AppText
                size={fs(16)}
                style={{
                  fontWeight: "800",
                  color: colors.textPrimary,
                  marginTop: 14,
                  letterSpacing: -0.2,
                }}
              >
                Set up your Digital ID
              </AppText>
              <AppText
                size={fs(13)}
                style={{
                  color: colors.textSecondary,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                Create your Digital ID to access all government services.
              </AppText>
              <View style={[styles.setupCta, { backgroundColor: colors.primary }]}>
                <AppText size={13} style={{ color: "#FFF", fontWeight: "700" }}>
                  Get started
                </AppText>
                <Ionicons name="arrow-forward" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Scan CTA */}
        <Animated.View style={[styles.scanWrap, scanAnim]}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDocumentScan}
            style={[
              styles.scanButton,
              {
                backgroundColor: colors.backgroundElevated,
                borderColor: colors.accent + "55",
              },
              Elevation.sm,
              { shadowColor: "#0B1220" },
            ]}
          >
            <View
              style={[styles.scanIconWrap, { backgroundColor: colors.accentSoft }]}
            >
              <Ionicons name="scan" size={22} color={colors.accentDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText
                size={fs(15)}
                style={{ fontWeight: "800", color: colors.textPrimary }}
              >
                {t("scanDocument")}
              </AppText>
              <AppText
                size={fs(11)}
                style={{ color: colors.textSecondary, marginTop: 2 }}
              >
                Capture and auto-fill from any government form
              </AppText>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.accentDeep} />
          </TouchableOpacity>
        </Animated.View>

        {/* Section header */}
        <Animated.View style={[styles.sectionHeader, titleAnim]}>
          <AppText
            size={fs(11)}
            style={{
              color: colors.textSecondary,
              letterSpacing: 1.4,
              fontWeight: "700",
              textTransform: "uppercase",
            }}
          >
            Documents
          </AppText>
          <AppText
            size={fs(20)}
            style={{
              fontWeight: "800",
              color: colors.textPrimary,
              marginTop: 2,
              letterSpacing: -0.3,
            }}
          >
            {t("yourSavedDocuments")}
          </AppText>
        </Animated.View>

        <Animated.View style={[styles.documentsList, docsAnim]}>
          {savedDocuments.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: colors.backgroundElevated,
                  borderColor: colors.borderLight,
                },
              ]}
            >
              <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="folder-open-outline" size={28} color={colors.primary} />
              </View>
              <AppText
                size={fs(14)}
                style={{
                  color: colors.textPrimary,
                  fontWeight: "700",
                  marginTop: 12,
                }}
              >
                No documents yet
              </AppText>
              <AppText
                size={fs(12)}
                style={{
                  color: colors.textSecondary,
                  marginTop: 4,
                  textAlign: "center",
                  paddingHorizontal: 24,
                }}
              >
                {t("noDocumentsSaved") || "Saved forms and IDs will appear here."}
              </AppText>
            </View>
          ) : (
            savedDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                colors={colors}
                onEdit={handleEdit}
                onDelete={handleDelete}
                t={t}
              />
            ))
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAddDocument}
            style={[
              styles.addDocumentButton,
              {
                backgroundColor: "transparent",
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <AppText
              size={fs(14)}
              style={{
                fontWeight: "700",
                color: colors.primary,
                marginLeft: 8,
                letterSpacing: 0.2,
              }}
            >
              {t("addMoreDocument") || "Add document"}
            </AppText>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  // ID Card
  idCardWrapper: { marginHorizontal: 16, marginTop: 12, marginBottom: 22 },
  idCard: {
    borderRadius: Radii.xl,
    padding: 20,
    minHeight: 200,
    overflow: "hidden",
  },
  idTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  idCrest: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  idCardBranding: {
    color: "rgba(255,255,255,0.65)",
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  idCardContent: { flexDirection: "row", alignItems: "center" },
  idCardAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  idCardInfo: { flex: 1 },
  idAddressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  idBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  verifyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(16,185,129,0.18)",
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  verifyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  orbA: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -80,
    right: -50,
    backgroundColor: "rgba(6,182,212,0.16)",
  },
  orbB: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    bottom: -60,
    left: -40,
    backgroundColor: "rgba(245,158,11,0.10)",
  },

  // Scan card
  scanWrap: { marginHorizontal: 16, marginBottom: 22 },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  scanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  // Setup card
  setupCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 22,
    padding: 28,
    alignItems: "center",
    borderRadius: Radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  setupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  setupCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radii.pill,
    marginTop: 18,
  },

  // Section header
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },

  // Documents
  documentsList: { paddingHorizontal: 16 },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    gap: 12,
  },
  docIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  documentInfo: { flex: 1 },
  documentActions: { flexDirection: "row", gap: 8 },
  iconActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  addDocumentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 6,
  },

  // Empty
  emptyState: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
