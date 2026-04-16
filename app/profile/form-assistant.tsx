import { AppText } from "@/components/common/AppText";
import { fs } from "@/constants/layout";
import {
  SavedDocument,
  SuggestedData,
  useAppContext,
} from "@/context/AppContext";
import { sendChatMessage } from "@/services/chatService";
import { auth } from "@/services/firebase";
import { addDocumentToFirestore, updateDocumentInFirestore } from "@/services/documentService";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FormDataField {
  label: string;
  value: string;
  isDownload?: boolean;
  key: string;
}

// Document-specific fields mapping
const DOCUMENT_FIELDS_MAP: Record<string, string[]> = {
  be_form: [
    "icNumber",
    "fullName",
    "dateOfBirth",
    "maritalStatus",
    "spouseIC",
    "spouseName",
    "address",
    "postcode",
  ],
  ea_form: [
    "icNumber",
    "fullName",
    "dateOfBirth",
    "taxIdentificationNumber",
    "eaForm",
    "address",
    "postcode",
  ],
  tax_return: [
    "icNumber",
    "fullName",
    "dateOfBirth",
    "taxIdentificationNumber",
    "bankAccountNumber",
    "nameOfBank",
    "bankHolderName",
  ],
  medical_claim: ["icNumber", "fullName", "dateOfBirth"],
  employment_cert: [
    "icNumber",
    "fullName",
    "dateOfBirth",
    "address",
    "bankAccountNumber",
  ],
  license_app: ["icNumber", "fullName", "dateOfBirth", "address", "postcode"],
};

const CATEGORIES = [
  { label: "Tax & Finance", value: "tax_finance" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Employment", value: "employment" },
  { label: "Transport", value: "transport" },
];

const DOCUMENTS = {
  tax_finance: [
    { label: "BE form", value: "be_form" },
    { label: "EA Form", value: "ea_form" },
    { label: "Tax Return", value: "tax_return" },
  ],
  healthcare: [{ label: "Medical Claim", value: "medical_claim" }],
  employment: [{ label: "Employment Certificate", value: "employment_cert" }],
  transport: [{ label: "License Application", value: "license_app" }],
};

const EMPTY_DATA: SuggestedData = {};

export default function FormAssistantScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    colors,
    elderlyMode,
    highContrast,
    addSavedDocument,
    updateSavedDocument,
    savedDocuments,
    userProfile,
  } = useAppContext();

  const [documentSearch, setDocumentSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("tax_finance");
  const [selectedDocument, setSelectedDocument] = useState("be_form");
  const [suggestedData, setSuggestedData] =
    useState<SuggestedData>(EMPTY_DATA);
  const [editableData, setEditableData] =
    useState<SuggestedData>(EMPTY_DATA);
  const [clipboardOutput, setClipboardOutput] = useState("");
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const ocrTriggered = useRef(false);

  // Map scan documentType to form category + document
  const SCAN_DOC_MAP: Record<string, { category: string; document: string }> = {
    be_form: { category: "tax_finance", document: "be_form" },
    ea_form: { category: "tax_finance", document: "ea_form" },
    tax_return: { category: "tax_finance", document: "tax_return" },
    medical_claim: { category: "healthcare", document: "medical_claim" },
    employment_cert: { category: "employment", document: "employment_cert" },
    license_app: { category: "transport", document: "license_app" },
  };

  // Convert image URI to base64 using fetch + FileReader
  const imageUriToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Strip the data:image/...;base64, prefix
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Auto-trigger OCR when arriving from scan page
  useEffect(() => {
    if (ocrTriggered.current) return;
    const fromScan = params.fromScan === "true";
    const imageUri = typeof params.imageUri === "string" ? decodeURIComponent(params.imageUri) : undefined;
    const scanDocType = typeof params.documentType === "string" ? params.documentType : undefined;

    if (!fromScan || !imageUri || !scanDocType) return;
    ocrTriggered.current = true;

    // Set the document type dropdowns
    const mapping = SCAN_DOC_MAP[scanDocType];
    if (mapping) {
      setSelectedCategory(mapping.category);
      setSelectedDocument(mapping.document);
    }

    // Read image, convert to base64, call OCR
    (async () => {
      setIsOcrLoading(true);
      try {
        const base64 = await imageUriToBase64(imageUri);
        const response = await sendChatMessage(
          "Extract fields from scanned document",
          [],
          {
            mode: "ocr",
            documentType: scanDocType,
            imageBase64: base64,
          }
        );
        if (response.formData) {
          setEditableData(response.formData);
          setSuggestedData(response.formData);
        }
      } catch (err: any) {
        console.error("[form-assistant] OCR failed:", err);
        Alert.alert(
          "OCR Failed",
          "Could not extract text from the scanned image. You can fill in the fields manually or try AI Auto-Fill."
        );
      } finally {
        setIsOcrLoading(false);
      }
    })();
  }, [params.fromScan, params.imageUri, params.documentType]);

  // Check if editing an existing document
  useEffect(() => {
    if (params.docId) {
      const docId =
        typeof params.docId === "string" ? params.docId : params.docId[0];
      setEditingDocId(docId);

      // Find the document and load its data
      const savedDoc = savedDocuments.find((doc) => doc.id === docId);
      if (savedDoc) {
        setSelectedCategory(savedDoc.category);
        setSelectedDocument(savedDoc.document);
        setEditableData(savedDoc.data);
        setSuggestedData(savedDoc.data);
        setDocumentName(savedDoc.name);
      }
    }
  }, [params.docId, savedDocuments]);

  const currentDocuments =
    DOCUMENTS[selectedCategory as keyof typeof DOCUMENTS] || [];
  const selectedCategoryLabel =
    CATEGORIES.find((c) => c.value === selectedCategory)?.label || "";
  const selectedDocumentLabel =
    currentDocuments.find((d) => d.value === selectedDocument)?.label || "";

  // Function to format and copy data to clipboard
  const handleCopyToClipboard = () => {
    const formattedOutput = formatOutputText();
    Clipboard.setString(formattedOutput);
    setClipboardOutput(formattedOutput);
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  };

  // Function to format output text
  const formatOutputText = (): string => {
    let output = `${t("fullName")}: ${editableData.fullName}\n`;
    output += `IC: ${editableData.icNumber}\n`;
    output += `TIN: ${editableData.taxIdentificationNumber || "N/A"}\n`;
    output += `${t("address")}: ${editableData.address}`;
    return output;
  };

  // Handle field value change
  const handleFieldChange = (fieldKey: string, value: string) => {
    setEditableData({
      ...editableData,
      [fieldKey]: value,
    });
  };

  // Save document
  const handleSaveDocument = async () => {
    if (!documentName.trim()) {
      Alert.alert(
        t("error"),
        t("documentNameRequired") || "Please enter document name",
      );
      return;
    }

    const now = new Date().toISOString();
    const userId = auth.currentUser?.uid;

    if (editingDocId) {
      // Update existing document
      const updates = {
        name: documentName,
        category: selectedCategory,
        document: selectedDocument,
        data: editableData,
        updatedAt: now,
      };
      updateSavedDocument(editingDocId, updates);

      // Sync to Firestore
      if (userId) {
        updateDocumentInFirestore(editingDocId, updates).catch((err) =>
          console.warn("[form-assistant] Firestore update failed:", err),
        );
      }

      Alert.alert(
        t("success"),
        t("documentUpdated") || "Document updated successfully",
      );
    } else {
      // Create new document
      const newDocData = {
        name: documentName,
        category: selectedCategory,
        document: selectedDocument,
        data: editableData,
        createdAt: now,
        updatedAt: now,
      };

      if (userId) {
        try {
          const firestoreId = await addDocumentToFirestore(userId, newDocData);
          addSavedDocument({ ...newDocData, id: firestoreId });
        } catch (err) {
          console.warn("[form-assistant] Firestore add failed:", err);
          // Fallback: save locally with timestamp ID
          addSavedDocument({ ...newDocData, id: Date.now().toString() });
        }
      } else {
        addSavedDocument({ ...newDocData, id: Date.now().toString() });
      }

      Alert.alert(
        t("success"),
        t("documentSaved") || "Document saved successfully",
      );
    }

    // Navigate back to profile
    router.back();
  };

  // AI Auto-Fill — pre-populates from MyKAD profile, then fills remaining with AI
  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    try {
      // Start with user's MyKAD data for known fields
      const profileFields: Record<string, string> = {};
      if (userProfile) {
        if (userProfile.fullName) profileFields.fullName = userProfile.fullName;
        if (userProfile.icNumber) profileFields.icNumber = userProfile.icNumber;
        if (userProfile.address) profileFields.address = userProfile.address;
        // bankHolderName is usually the same as fullName
        if (userProfile.fullName) profileFields.bankHolderName = userProfile.fullName;
      }

      // Merge: existing edits > profile data
      const existingWithProfile = { ...profileFields, ...editableData };
      // Remove empty values so AI fills them
      const nonEmpty: Record<string, string> = {};
      for (const [k, v] of Object.entries(existingWithProfile)) {
        if (v && v.trim()) nonEmpty[k] = v;
      }

      const response = await sendChatMessage(
        "Fill form fields",
        [],
        {
          mode: "form-fill",
          documentType: selectedDocument,
          existingFields: nonEmpty,
        }
      );
      if (response.formData) {
        // Profile data takes priority over AI-generated for identity fields
        const merged = { ...response.formData, ...nonEmpty };
        setEditableData(merged);
        setSuggestedData(merged);
      } else {
        // Even without AI response, apply profile data
        setEditableData(existingWithProfile);
        setSuggestedData(existingWithProfile);
      }
    } catch (err: any) {
      // On AI failure, still apply profile data
      const profileFallback: SuggestedData = { ...editableData };
      if (userProfile) {
        if (userProfile.fullName && !profileFallback.fullName) profileFallback.fullName = userProfile.fullName;
        if (userProfile.icNumber && !profileFallback.icNumber) profileFallback.icNumber = userProfile.icNumber;
        if (userProfile.address && !profileFallback.address) profileFallback.address = userProfile.address;
        if (userProfile.fullName && !profileFallback.bankHolderName) profileFallback.bankHolderName = userProfile.fullName;
      }
      setEditableData(profileFallback);
      setSuggestedData(profileFallback);
      Alert.alert(
        "Partial Auto-Fill",
        "AI service unavailable, but we've filled in your MyKAD details.",
      );
      console.error("[form-assistant] auto-fill failed:", err);
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Get fields to display based on selected document
  const getDisplayFields = (): FormDataField[] => {
    const fieldKeys = DOCUMENT_FIELDS_MAP[selectedDocument] || [];
    const displayFields: FormDataField[] = [];

    const fieldLabelMap: Record<string, string> = {
      icNumber: t("icNumber"),
      fullName: t("fullName"),
      dateOfBirth: t("dateOfBirth"),
      taxIdentificationNumber: t("taxIdentificationNumber"),
      eaForm: t("eaForm"),
      address: t("address"),
      postcode: t("postcode"),
      bankAccountNumber: t("bankAccountNumber"),
      nameOfBank: t("nameOfBank"),
      bankHolderName: t("bankHolderName"),
      maritalStatus: t("maritalStatus"),
      spouseIC: t("spouseIC"),
      spouseName: t("spouseName"),
    };

    fieldKeys.forEach((fieldKey) => {
      if (fieldKey === "eaForm") {
        displayFields.push({
          label: fieldLabelMap[fieldKey],
          value: "Download file",
          isDownload: true,
          key: fieldKey,
        });
      } else {
        displayFields.push({
          label: fieldLabelMap[fieldKey],
          value: editableData[fieldKey] || "",
          key: fieldKey,
        });
      }
    });

    return displayFields;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
          size={fs(18)}
          style={{
            fontWeight: "700",
            color: colors.textPrimary,
            flex: 1,
            textAlign: "center",
            marginRight: 24,
          }}
        >
          {editingDocId
            ? t("editDocument") || "Edit Document"
            : t("newDocument") || "New Document"}
        </AppText>
      </View>

      {/* OCR Loading Overlay */}
      {isOcrLoading && (
        <View style={[styles.ocrOverlay, { backgroundColor: colors.background + "E6" }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText
            size={fs(16)}
            style={{ color: colors.textPrimary, fontWeight: "600", marginTop: 16 }}
          >
            Extracting document fields...
          </AppText>
          <AppText
            size={fs(13)}
            style={{ color: colors.textSecondary, marginTop: 8, textAlign: "center" }}
          >
            Analyzing your scanned document with AI
          </AppText>
        </View>
      )}

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Document Name Input */}
        <View style={styles.section}>
          <AppText
            size={fs(14)}
            style={[
              styles.label,
              { fontWeight: "600", color: colors.textPrimary, marginBottom: 8 },
            ]}
          >
            {t("documentName") || "Document Name"}
          </AppText>
          <TextInput
            style={[
              styles.documentNameInput,
              {
                backgroundColor: colors.backgroundGrouped,
                borderColor: highContrast ? colors.border : "transparent",
                borderWidth: highContrast ? 2 : 1,
                color: colors.textPrimary,
                fontSize: fs(14),
              },
            ]}
            placeholder={`${selectedDocumentLabel} - Your Name`}
            placeholderTextColor={colors.textPlaceholder}
            value={documentName}
            onChangeText={setDocumentName}
          />
        </View>

        {/* Document Search Section */}
        <View style={styles.section}>
          <AppText
            size={fs(14)}
            style={[
              styles.label,
              { fontWeight: "600", color: colors.textPrimary, marginBottom: 8 },
            ]}
          >
            {t("selectDocumentToFillIn")}
          </AppText>
          <View
            style={[
              styles.searchInputContainer,
              {
                backgroundColor: colors.backgroundGrouped,
                borderColor: highContrast ? colors.border : "transparent",
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
          >
            <TextInput
              style={[
                styles.searchInput,
                { color: colors.textPrimary, fontSize: fs(14) },
              ]}
              placeholder={t("search")}
              placeholderTextColor={colors.textPlaceholder}
              value={documentSearch}
              onChangeText={setDocumentSearch}
            />
            <Ionicons
              name="search"
              size={elderlyMode ? 20 : 18}
              color={colors.textSecondary}
            />
          </View>
        </View>

        {/* Category & Document Selection */}
        <View style={styles.section}>
          {/* Category Dropdown */}
          <View style={styles.dropdownRow}>
            <View style={{ flex: 1 }}>
              <AppText
                size={fs(12)}
                style={[
                  styles.label,
                  {
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 8,
                  },
                ]}
              >
                {t("selectCategories")}
              </AppText>
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.backgroundGrouped,
                    borderColor: highContrast ? colors.border : "transparent",
                    borderWidth: highContrast ? 2 : 1,
                  },
                ]}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <AppText
                  size={fs(13)}
                  style={{ color: colors.textPrimary, fontWeight: "500" }}
                >
                  {selectedCategoryLabel}
                </AppText>
                <Ionicons
                  name={showCategoryDropdown ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {showCategoryDropdown && (
                <View
                  style={[
                    styles.dropdownMenu,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        setSelectedCategory(cat.value);
                        setSelectedDocument(
                          DOCUMENTS[cat.value as keyof typeof DOCUMENTS][0]
                            .value,
                        );
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <AppText
                        size={fs(13)}
                        style={{ color: colors.textPrimary }}
                      >
                        {cat.label}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Document Dropdown */}
            <View style={[{ flex: 1, marginLeft: 12 }]}>
              <AppText
                size={fs(12)}
                style={[
                  styles.label,
                  {
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginBottom: 8,
                  },
                ]}
              >
                {t("documentSuggested")}
              </AppText>
              <TouchableOpacity
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.backgroundGrouped,
                    borderColor: highContrast ? colors.border : "transparent",
                    borderWidth: highContrast ? 2 : 1,
                  },
                ]}
                onPress={() => setShowDocumentDropdown(!showDocumentDropdown)}
              >
                <AppText
                  size={fs(13)}
                  style={{ color: colors.textPrimary, fontWeight: "500" }}
                >
                  {selectedDocumentLabel}
                </AppText>
                <Ionicons
                  name={showDocumentDropdown ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {showDocumentDropdown && (
                <View
                  style={[
                    styles.dropdownMenu,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {currentDocuments.map((doc) => (
                    <TouchableOpacity
                      key={doc.value}
                      style={styles.dropdownMenuItem}
                      onPress={() => {
                        setSelectedDocument(doc.value);
                        setShowDocumentDropdown(false);
                      }}
                    >
                      <AppText
                        size={fs(13)}
                        style={{ color: colors.textPrimary }}
                      >
                        {doc.label}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Divider */}
          <View
            style={[
              styles.divider,
              { backgroundColor: colors.separator, marginVertical: 16 },
            ]}
          />
        </View>

        {/* AI Auto-Fill Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.autoFillButton,
              {
                backgroundColor: colors.primary,
                opacity: isAutoFilling ? 0.7 : 1,
              },
            ]}
            onPress={handleAutoFill}
            disabled={isAutoFilling}
            activeOpacity={0.7}
          >
            {isAutoFilling ? (
              <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons
                name="sparkles"
                size={elderlyMode ? 18 : 16}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
            )}
            <AppText
              size={fs(15)}
              style={{ color: "#FFF", fontWeight: "600" }}
            >
              {isAutoFilling ? "Auto-Filling..." : "AI Auto-Fill"}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Editable Information Fields */}
        <View style={styles.section}>
          <AppText
            size={fs(16)}
            style={[
              styles.label,
              {
                fontWeight: "700",
                color: colors.textPrimary,
                marginBottom: 12,
              },
            ]}
          >
            {t("information") || "Information"}
          </AppText>

          {/* Information Fields */}
          {getDisplayFields().map((field, index) => (
            <View key={index} style={styles.infoField}>
              <AppText
                size={fs(13)}
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary, fontWeight: "500" },
                ]}
              >
                {field.label}
              </AppText>
              {field.isDownload ? (
                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    { backgroundColor: "#FFD4A3" },
                  ]}
                  onPress={() => {
                    console.log("Download file");
                  }}
                >
                  <AppText
                    size={fs(12)}
                    style={{
                      color: "#D68A2E",
                      fontWeight: "600",
                    }}
                  >
                    {t("downloadFile")}
                  </AppText>
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={[
                    styles.editableField,
                    {
                      backgroundColor: colors.backgroundGrouped,
                      borderColor: highContrast ? colors.border : "transparent",
                      borderWidth: highContrast ? 2 : 1,
                      color: colors.textPrimary,
                      fontSize: fs(14),
                    },
                  ]}
                  value={field.value}
                  onChangeText={(value) => handleFieldChange(field.key, value)}
                  placeholder={`Enter ${field.label}`}
                  placeholderTextColor={colors.textPlaceholder}
                />
              )}
            </View>
          ))}
        </View>

        {/* Copy to Clipboard & Save Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.copyButton,
              {
                backgroundColor: "#FFD4A3",
                borderColor: highContrast ? colors.border : "transparent",
                borderWidth: highContrast ? 2 : 0,
              },
            ]}
            onPress={handleCopyToClipboard}
            activeOpacity={0.7}
          >
            <Ionicons
              name="copy"
              size={elderlyMode ? 18 : 16}
              color="#D68A2E"
              style={{ marginRight: 8 }}
            />
            <AppText
              size={fs(15)}
              style={{ color: "#D68A2E", fontWeight: "600" }}
            >
              {t("copyAllToClipboard")}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor: "#B8A2FF",
                borderColor: highContrast ? colors.border : "transparent",
                borderWidth: highContrast ? 2 : 0,
                marginTop: 12,
              },
            ]}
            onPress={handleSaveDocument}
            activeOpacity={0.7}
          >
            <Ionicons
              name="save"
              size={elderlyMode ? 18 : 16}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <AppText
              size={fs(15)}
              style={{ color: "#FFFFFF", fontWeight: "600" }}
            >
              {editingDocId
                ? t("updateDocument") || "Update Document"
                : t("saveDocument") || "Save Document"}
            </AppText>
          </TouchableOpacity>

          {/* Copied Message */}
          {showCopiedMessage && (
            <View
              style={[styles.copiedMessage, { backgroundColor: "#E8F5E9" }]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
              <AppText
                size={fs(13)}
                style={{ color: "#4CAF50", fontWeight: "500", marginLeft: 8 }}
              >
                {t("copied")}
              </AppText>
            </View>
          )}
        </View>

        {/* Output Preview Section */}
        {clipboardOutput && (
          <View style={styles.section}>
            <AppText
              size={fs(15)}
              style={[
                styles.label,
                {
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: 12,
                },
              ]}
            >
              {t("outcut")}
            </AppText>
            <View
              style={[
                styles.outputBox,
                {
                  backgroundColor: colors.backgroundGrouped,
                  borderColor: colors.border,
                  borderWidth: highContrast ? 2 : 1,
                },
              ]}
            >
              <AppText
                size={fs(13)}
                style={{
                  color: colors.textPrimary,
                  fontWeight: "500",
                  lineHeight: 20,
                }}
              >
                {clipboardOutput}
              </AppText>
            </View>
          </View>
        )}
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
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  documentNameInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  dropdownRow: {
    flexDirection: "row",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 1000,
  },
  dropdownMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  infoField: {
    marginBottom: 12,
  },
  fieldLabel: {
    marginBottom: 4,
  },
  fieldValue: {
    paddingVertical: 8,
  },
  editableField: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 40,
  },
  downloadButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  copyButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  copiedMessage: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  outputBox: {
    padding: 12,
    borderRadius: 8,
  },
  ocrOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  autoFillButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
