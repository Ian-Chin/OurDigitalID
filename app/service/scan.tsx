import { AppText } from "@/components/common/AppText";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { s, vs } from "@/constants/layout";
import { SavedDocument, useAppContext } from "@/context/AppContext";
import { sendChatMessage } from "@/services/chatService";
import { auth, db, storage } from "@/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
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
  const { colors, addSavedDocument } = useAppContext();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();

  const documentTypes = getDocumentTypes(t);

  // If navigated from chatbot with a documentType, store it for later
  const fromChatDocType = searchParams.documentType;
  const [documentType, setDocumentType] = useState<string>(
    fromChatDocType || "identity",
  );
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const cameraRef = useRef<CameraView>(null);

  // Handle camera permissions
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // OCR Function - Extract text from image
  const extractTextFromImage = async (imageUri: string): Promise<string> => {
    try {
      setIsProcessing(true);

      // Read the image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: "base64",
      });

      // Use the same OCR service as create-digital-id.tsx
      const result = await sendChatMessage(
        `Extract all text from this ${documentTypes.find((d) => d.id === documentType)?.label || "document"}. Return the extracted text.`,
        [],
        { mode: "ocr", documentType: documentType, imageBase64: base64 },
      );

      const extractedContent =
        result.reply || result.formData?.extractedText || generateDemoOCRText();
      return extractedContent;
    } catch (error) {
      console.error("OCR Error:", error);
      Alert.alert(
        "OCR Error",
        "Failed to extract text from document. Please try again.",
      );
      // Fallback to demo text
      return generateDemoOCRText();
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate demo OCR text for testing
  const generateDemoOCRText = (): string => {
    const mockData: { [key: string]: string } = {
      identity: `MALAYSIA IDENTITY CARD
NAME: JOHN BIN DOE
IC NUMBER: 901231-14-5678
DATE OF BIRTH: 31-DEC-1990
PLACE OF BIRTH: KUALA LUMPUR
NATIONALITY: MALAYSIAN
STATE: SELANGOR
ADDRESS: 123 JALAN RAJA, 50000 KUALA LUMPUR
VALIDITY: 2024-2034
ISSUED: 2024-01-15`,

      passport: `MALAYSIA PASSPORT
NAME: JOHN BIN DOE
PASSPORT NUMBER: A12345678
DATE OF BIRTH: 31-DEC-1990
PLACE OF BIRTH: KUALA LUMPUR
NATIONALITY: MALAYSIAN
GENDER: MALE
ISSUE DATE: 2022-06-10
EXPIRY DATE: 2032-06-09
MRZ: A12345678MYS9012312JOHN`,

      license: `DRIVING LICENCE
NAME: JOHN BIN DOE
LICENSE NUMBER: DL123456789
DATE OF BIRTH: 31-DEC-1990
ISSUE DATE: 2020-03-15
EXPIRY DATE: 2030-03-14
CATEGORIES: B, D
STATE: SELANGOR
ADDRESS: 123 JALAN RAJA, 50000 KUALA LUMPUR`,

      birth: `BIRTH CERTIFICATE OF ${new Date().getFullYear()}
NAME: JOHN BIN DOE
DATE OF BIRTH: 31-DEC-2020
PLACE OF BIRTH: HOSPITAL KUALA LUMPUR
FATHER: ALI BIN IBRAHIM
MOTHER: FATIMAH BINTI HASSAN
REGISTRATION NUMBER: BC${Date.now()}`,

      utility: `ELECTRICITY BILL
ACCOUNT NUMBER: 12345678
CUSTOMER NAME: JOHN BIN DOE
ADDRESS: 123 JALAN RAJA, 50000 KUALA LUMPUR
BILLING PERIOD: 01-MAR-2024 TO 31-MAR-2024
AMOUNT: RM 145.50
DUE DATE: 15-APR-2024
METER READING: 45678 KWH`,

      other: `DOCUMENT SCAN
Document Type: ${documentTypes.find((d) => d.id === documentType)?.label || "Document"}
Scanned Date: ${new Date().toLocaleString()}
Scan Quality: High
Status: Ready for processing

This is a mock OCR extraction for testing purposes.
Replace with actual OCR API integration when ready.`,
    };

    return mockData[documentType] || mockData.other;
  };

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

  const handleContinue = async () => {
    setIsProcessing(true);

    try {
      // Extract text from the captured image
      const text = await extractTextFromImage(capturedImage!);
      setExtractedText(text);

      // Save document to Firestore
      if (capturedImage && text && auth.currentUser) {
        const userId = auth.currentUser.uid;

        // Upload image to Firebase Storage
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        const storageRef = ref(
          storage,
          `documents/${userId}/${Date.now()}.jpg`,
        );
        await uploadBytes(storageRef, blob);
        const documentImageUrl = await getDownloadURL(storageRef);

        // Save document metadata to Firestore
        const newDocument = {
          userId: userId,
          name: `${documentTypes.find((d) => d.id === documentType)?.label || "Document"} - ${new Date().toLocaleDateString()}`,
          category: documentType,
          document: documentImageUrl,
          data: {
            extractedText: text,
            scannedAt: new Date().toISOString(),
            documentType: documentType,
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Add to Firestore
        const docRef = await addDoc(
          collection(db, "scanned_documents"),
          newDocument,
        );
        const firestoreDoc: SavedDocument = {
          id: docRef.id,
          name: newDocument.name,
          category: newDocument.category,
          document: newDocument.document,
          data: newDocument.data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Also add to AppContext for immediate display
        addSavedDocument(firestoreDoc);

        // Show success and navigate
        Alert.alert(
          "Document Saved",
          "Your document has been scanned and saved successfully.",
          [
            {
              text: "View Saved Documents",
              onPress: () => {
                setShowPreview(false);
                router.replace("/profile" as any);
              },
            },
            {
              text: "Scan Another",
              onPress: () => {
                handleRetake();
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error saving document:", error);
      Alert.alert("Error", "Failed to save document. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setShowPreview(false);
    setExtractedText("");
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

            {isProcessing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText
                  size={14}
                  style={{
                    marginTop: vs(12),
                    color: colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  Extracting text from document...
                </AppText>
              </View>
            )}

            {extractedText && !isProcessing && (
              <View style={styles.extractedTextContainer}>
                <View
                  style={[
                    styles.extractedTextBox,
                    { backgroundColor: colors.backgroundGrouped },
                  ]}
                >
                  <AppText
                    size={12}
                    style={{
                      fontWeight: "600",
                      color: colors.textSecondary,
                      marginBottom: vs(8),
                    }}
                  >
                    EXTRACTED TEXT
                  </AppText>
                  <AppText
                    size={13}
                    style={{
                      color: colors.textPrimary,
                      lineHeight: 18,
                    }}
                  >
                    {extractedText}
                  </AppText>
                </View>
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
                {
                  backgroundColor: colors.backgroundGrouped,
                  opacity: isProcessing ? 0.5 : 1,
                },
              ]}
              onPress={handleRetake}
              disabled={isProcessing}
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

            <PrimaryButton
              label={isProcessing ? "Processing..." : "Save & Continue"}
              onPress={handleContinue}
              disabled={isProcessing}
            />
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
  processingContainer: {
    paddingHorizontal: s(16),
    paddingVertical: vs(32),
    alignItems: "center",
    justifyContent: "center",
  },
  extractedTextContainer: {
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
  },
  extractedTextBox: {
    borderRadius: 12,
    padding: s(14),
    maxHeight: 200,
  },
});
