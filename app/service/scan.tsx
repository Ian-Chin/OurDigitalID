import { AppText } from "@/components/common/AppText";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface DocumentType {
  id: string;
  label: string;
}

const getDocumentTypes = (t: any): DocumentType[] => [
  { id: "identity", label: t("myKad") || "MyKad / IC" },
  { id: "passport", label: t("passport") || "Passport" },
  { id: "license", label: t("license") || "Driving License" },
  { id: "birth", label: "Birth Certificate" },
  { id: "utility", label: "Utility Bill" },
  { id: "other", label: "Other Document" },
];

export default function DocumentScannerPage() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ documentType?: string }>();
  const { colors } = useAppContext();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();

  const documentTypes = getDocumentTypes(t);

  // If navigated from chatbot with a documentType, store it for later
  const fromChatDocType = searchParams.documentType;
  const [documentType, setDocumentType] = useState<string>(fromChatDocType || "identity");
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Handle camera permissions
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppText size={14}>Loading camera permissions...</AppText>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.permissionContainer}>
          <IconSymbol size={48} name="camera.fill" color={colors.primary} />
          <AppText
            size={16}
            style={{
              fontWeight: "700",
              marginTop: vs(16),
              textAlign: "center",
              color: colors.textPrimary,
            }}
          >
            Camera Permission Required
          </AppText>
          <AppText
            size={14}
            style={{
              marginTop: vs(8),
              marginHorizontal: s(16),
              textAlign: "center",
              color: colors.textSecondary,
              lineHeight: 20,
            }}
          >
            We need access to your camera to scan documents. Please enable
            camera permissions in your device settings.
          </AppText>
          <View style={{ marginTop: vs(24), paddingHorizontal: s(16) }}>
            <PrimaryButton
              label="Open Settings"
              onPress={() => {
                // In production, use Linking to open device settings
                router.back();
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo && photo.uri) {
        setCapturedImage(photo.uri);
        setShowPreview(true);
      }
    }
  };

  const handleContinue = () => {
    if (fromChatDocType && capturedImage) {
      // Navigate to form-assistant with scanned image URI for OCR
      setShowPreview(false);
      router.replace(
        `/profile/form-assistant?fromScan=true&documentType=${fromChatDocType}&imageUri=${encodeURIComponent(capturedImage)}` as any
      );
    } else {
      // Default behavior
      setShowPreview(false);
      setCapturedImage(null);
      router.back();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setShowPreview(false);
  };

  const selectedDocumentLabel =
    documentTypes.find((d) => d.id === documentType)?.label ||
    "Select Document";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      {/* Header with Back Button */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            paddingHorizontal: 16,
            paddingVertical: 12,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText
          size={18}
          style={{
            fontWeight: "700",
            color: colors.textPrimary,
            flex: 1,
            textAlign: "center",
            marginRight: 24,
          }}
        >
          Scan Document
        </AppText>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Document Type Section */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <IconSymbol size={20} name="doc.text" color={colors.primary} />
            <AppText
              size={13}
              style={{
                fontWeight: "600",
                marginLeft: s(8),
                color: colors.textSecondary,
              }}
            >
              DOCUMENT TYPE
            </AppText>
          </View>

          <TouchableOpacity
            style={[
              styles.typeSelector,
              { backgroundColor: colors.backgroundGrouped },
            ]}
            onPress={() => setShowTypeSelector(true)}
          >
            <View style={styles.typeSelectorContent}>
              <AppText
                size={15}
                style={{
                  fontWeight: "500",
                  color: colors.textPrimary,
                }}
              >
                {selectedDocumentLabel}
              </AppText>
              <IconSymbol
                size={18}
                name="chevron.down"
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Camera Section */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <IconSymbol size={20} name="camera.fill" color={colors.primary} />
            <AppText
              size={13}
              style={{
                fontWeight: "600",
                marginLeft: s(8),
                color: colors.textSecondary,
              }}
            >
              POSITION DOCUMENT
            </AppText>
          </View>

          {/* Camera View */}
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              mode="picture"
            />

            {/* Dimmed Overlays */}
            <View style={styles.topOverlay} />
            <View style={styles.bottomOverlay} />

            {/* Scanning Frame */}
            <View style={styles.frameOverlay}>
              <View style={styles.frameBorder} />
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>

            {/* Instruction Text */}
            <View style={styles.instructionOverlay}>
              <AppText
                size={11}
                style={{
                  color: "white",
                  textAlign: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  paddingVertical: vs(6),
                  paddingHorizontal: s(12),
                  borderRadius: 6,
                  fontWeight: "500",
                }}
              >
                Ensure document is well-lit and fully visible
              </AppText>
            </View>

            {/* Capture Button Overlay */}
            <TouchableOpacity
              style={styles.captureIconButton}
              onPress={takePhoto}
              activeOpacity={0.7}
            >
              <Image
                source={require("@/assets/images/capture-icon.png")}
                style={styles.captureIconImage}
              />
            </TouchableOpacity>
          </View>

          {/* Tips Section */}
          <View
            style={[
              styles.tipsBox,
              { backgroundColor: colors.backgroundGrouped },
            ]}
          >
            <View style={styles.tipItem}>
              <IconSymbol
                size={16}
                name="lightbulb.fill"
                color={colors.primary}
              />
              <AppText
                size={12}
                style={{
                  marginLeft: s(8),
                  flex: 1,
                  color: colors.textSecondary,
                }}
              >
                Ensure good lighting
              </AppText>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol
                size={16}
                name="checkmark.circle.fill"
                color={colors.primary}
              />
              <AppText
                size={12}
                style={{
                  marginLeft: s(8),
                  flex: 1,
                  color: colors.textSecondary,
                }}
              >
                All corners must be visible
              </AppText>
            </View>
            <View style={styles.tipItem}>
              <IconSymbol size={16} name="square.fill" color={colors.primary} />
              <AppText
                size={12}
                style={{
                  marginLeft: s(8),
                  flex: 1,
                  color: colors.textSecondary,
                }}
              >
                Center the document
              </AppText>
            </View>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Document Type Picker Modal */}
      <Modal
        visible={showTypeSelector}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTypeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <View style={styles.modalHandle} />

            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor: colors.backgroundGrouped,
                  borderBottomWidth: 1,
                },
              ]}
            >
              <AppText
                size={16}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                }}
              >
                Document Type
              </AppText>
              <TouchableOpacity onPress={() => setShowTypeSelector(false)}>
                <IconSymbol
                  size={24}
                  name="xmark"
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
            >
              {documentTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    {
                      backgroundColor:
                        documentType === type.id
                          ? colors.backgroundGrouped
                          : colors.background,
                    },
                  ]}
                  onPress={() => {
                    setDocumentType(type.id);
                    setShowTypeSelector(false);
                  }}
                >
                  <AppText
                    size={14}
                    style={{
                      color: colors.textPrimary,
                      flex: 1,
                      fontWeight: documentType === type.id ? "600" : "400",
                    }}
                  >
                    {type.label}
                  </AppText>
                  {documentType === type.id && (
                    <IconSymbol
                      size={20}
                      name="checkmark.circle.fill"
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPreview(false)}
      >
        <View
          style={[
            styles.previewContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.previewHeader,
              { borderBottomColor: colors.backgroundGrouped },
            ]}
          >
            <AppText
              size={18}
              style={{
                fontWeight: "700",
                color: colors.textPrimary,
              }}
            >
              Review Scan
            </AppText>
            <TouchableOpacity onPress={handleRetake}>
              <IconSymbol size={24} name="xmark" color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {capturedImage && (
              <View style={styles.previewImageWrapper}>
                <Image
                  source={{ uri: capturedImage as string }}
                  style={styles.previewImage}
                />
              </View>
            )}

            <View style={styles.previewInfo}>
              <View style={styles.previewInfoItem}>
                <IconSymbol size={18} name="doc.text" color={colors.primary} />
                <AppText
                  size={12}
                  style={{ marginLeft: s(8), color: colors.textSecondary }}
                >
                  Document Type:{" "}
                  <AppText
                    size={12}
                    style={{ fontWeight: "600", color: colors.textPrimary }}
                  >
                    {selectedDocumentLabel}
                  </AppText>
                </AppText>
              </View>
            </View>
          </ScrollView>

          <View style={styles.previewButtonContainer}>
            <TouchableOpacity
              style={[
                styles.previewButton,
                { backgroundColor: colors.backgroundGrouped },
              ]}
              onPress={handleRetake}
            >
              <IconSymbol
                size={20}
                name="arrow.counterclockwise"
                color={colors.primary}
              />
              <AppText
                size={14}
                style={{
                  fontWeight: "600",
                  color: colors.primary,
                  marginLeft: s(8),
                }}
              >
                Retake
              </AppText>
            </TouchableOpacity>

            <PrimaryButton label="Save & Continue" onPress={handleContinue} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: vs(20),
  },
  section: {
    paddingHorizontal: s(16),
    marginTop: vs(24),
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(12),
  },
  typeSelector: {
    borderRadius: 12,
    paddingHorizontal: s(14),
    paddingVertical: vs(13),
    flexDirection: "row",
  },
  typeSelectorContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cameraContainer: {
    width: "100%",
    height: 500,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "20%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "20%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  frameOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  frameBorder: {
    width: "75%",
    height: 220,
    borderWidth: 2.5,
    borderColor: "#4CAF50",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  cornerTL: {
    position: "absolute",
    top: "35%",
    left: "12.5%",
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#4CAF50",
    borderRadius: 2,
  },
  cornerTR: {
    position: "absolute",
    top: "35%",
    right: "12.5%",
    width: 16,
    height: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#4CAF50",
    borderRadius: 2,
  },
  cornerBL: {
    position: "absolute",
    bottom: "35%",
    left: "12.5%",
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#4CAF50",
    borderRadius: 2,
  },
  cornerBR: {
    position: "absolute",
    bottom: "35%",
    right: "12.5%",
    width: 16,
    height: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#4CAF50",
    borderRadius: 2,
  },
  instructionOverlay: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureIconButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -45,
    marginTop: -45,
    borderRadius: 50,
    padding: s(8),
  },
  captureIconImage: {
    width: 70,
    height: 70,
    resizeMode: "contain",
  },
  tipsBox: {
    marginTop: vs(16),
    borderRadius: 12,
    padding: s(14),
    gap: vs(10),
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHandle: {
    height: 4,
    width: 40,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: vs(8),
    marginBottom: vs(8),
  },
  modalScroll: {
    paddingHorizontal: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
  },
  previewContainer: {
    flex: 1,
    paddingVertical: vs(16),
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    borderBottomWidth: 1,
    marginBottom: vs(20),
  },
  previewImageWrapper: {
    paddingHorizontal: s(16),
    marginBottom: vs(20),
  },
  previewImage: {
    width: "100%",
    height: 380,
    borderRadius: 12,
    resizeMode: "cover",
  },
  previewInfo: {
    paddingHorizontal: s(16),
    marginBottom: vs(24),
  },
  previewInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(10),
  },
  previewButtonContainer: {
    paddingHorizontal: s(16),
    gap: s(12),
    paddingBottom: vs(20),
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: vs(13),
    borderRadius: 12,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: s(24),
  },
});
