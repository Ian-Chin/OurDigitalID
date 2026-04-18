import { AppText } from "@/components/common/AppText";
import { vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = "disaster" | "rescue" | "feedback";
type SeverityLevel = "low" | "moderate" | "high" | "critical";

interface AttachedFile {
  uri: string;
  name: string;
  type: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPES: {
  key: ReportType;
  label: string;
  description: string;
  color: string;
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "disaster",
    label: "Disaster Report",
    description: "Flood, fire, landslide, collapse",
    color: "#C62828",
    bg: "#FFEBEE",
    icon: "warning-outline",
  },
  {
    key: "rescue",
    label: "Rescue Request",
    description: "Trapped persons, urgent evacuation",
    color: "#1565C0",
    bg: "#E3F2FD",
    icon: "medkit-outline",
  },
  {
    key: "feedback",
    label: "Feedback / Complaint",
    description: "Public services, infrastructure",
    color: "#2E7D32",
    bg: "#E8F5E9",
    icon: "chatbubble-outline",
  },
];

const CATEGORIES: Record<ReportType, string[]> = {
  disaster: [
    "Flood / Rising water",
    "Fire / Explosion",
    "Landslide / Earth movement",
    "Structural collapse",
    "Road obstruction",
    "Other",
  ],
  rescue: [
    "Person trapped",
    "Evacuation needed",
    "Medical emergency",
    "Vehicle accident",
    "Missing person",
    "Other",
  ],
  feedback: [
    "Road / Infrastructure",
    "Public service complaint",
    "Waste / Cleanliness",
    "Government department",
    "Suggestion / Idea",
    "Other",
  ],
};

const SEVERITY_LEVELS: {
  key: SeverityLevel;
  label: string;
  color: string;
  bg: string;
}[] = [
  { key: "low", label: "Low", color: "#2E7D32", bg: "#E8F5E9" },
  { key: "moderate", label: "Moderate", color: "#E65100", bg: "#FFF3E0" },
  { key: "high", label: "High", color: "#AD1457", bg: "#FCE4EC" },
  { key: "critical", label: "Critical", color: "#C62828", bg: "#FFEBEE" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportScreen() {
  const router = useRouter();
  const { colors, userProfile } = useAppContext();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ type?: ReportType }>();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [reportType, setReportType] = useState<ReportType>(
    params.type ?? "disaster",
  );
  const [category, setCategory] = useState<string>(
    CATEGORIES[params.type ?? "disaster"][0],
  );
  const [severity, setSeverity] = useState<SeverityLevel>("moderate");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [wantsUpdates, setWantsUpdates] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationPinned, setLocationPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState("");

  // Sync category when report type changes
  useEffect(() => {
    setCategory(CATEGORIES[reportType][0]);
  }, [reportType]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleDetectLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Please enable location access in settings.",
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (address) {
        const parts = [
          address.street,
          address.district,
          address.city,
          address.region,
        ]
          .filter(Boolean)
          .join(", ");
        setLocationText(parts);
      }
      setLocationPinned(true);
    } catch {
      Alert.alert("Error", "Unable to retrieve your location. Try again.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleAttachMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Please allow media access to attach files.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newFiles: AttachedFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? `file_${Date.now()}`,
        type: asset.mimeType ?? "image/jpeg",
      }));
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!hasConsented) {
      Alert.alert(
        "Confirmation required",
        "Please confirm that the report is accurate before submitting.",
      );
      return;
    }
    if (!description.trim()) {
      Alert.alert("Description required", "Please describe the incident.");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: replace with your actual API call
      await new Promise((resolve) => setTimeout(resolve, 1800));
      const ref = `RPT-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 90000) + 10000,
      )}`;
      setReferenceId(ref);
      setSubmitted(true);
    } catch {
      Alert.alert("Submission failed", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const activeType = REPORT_TYPES.find((r) => r.key === reportType)!;
  const activeSeverity = SEVERITY_LEVELS.find((s) => s.key === severity)!;

  // ─────────────────────────────────────────────────────────────────────────
  // Success screen
  // ─────────────────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: "Report submitted",
            headerBackTitle: "Home",
          }}
        />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color="#2E7D32" />
          </View>
          <AppText size={22} style={styles.successTitle}>
            Report submitted
          </AppText>
          <AppText
            size={14}
            style={[styles.successSub, { color: colors.textSecondary }]}
          >
            Your report has been received and logged.
          </AppText>

          <View
            style={[
              styles.refCard,
              { backgroundColor: colors.backgroundGrouped },
            ]}
          >
            <AppText
              size={12}
              style={{ color: colors.textSecondary, marginBottom: vs(4) }}
            >
              Reference number
            </AppText>
            <AppText size={18} style={{ fontWeight: "700", color: "#1565C0" }}>
              {referenceId}
            </AppText>
            <AppText
              size={12}
              style={{ color: colors.textSecondary, marginTop: vs(6) }}
            >
              {severity === "critical" || severity === "high"
                ? "Expected response within 2 hours for high-priority reports."
                : "Track status under My Reports in your profile."}
            </AppText>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: activeType.color }]}
            onPress={() => router.replace("/home/Home" as any)}
          >
            <AppText size={15} style={{ color: "#fff", fontWeight: "600" }}>
              Back to home
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhost}
            onPress={() => {
              setSubmitted(false);
              setDescription("");
              setAttachments([]);
              setLocationPinned(false);
              setLocationText("");
              setHasConsented(false);
            }}
          >
            <AppText
              size={14}
              style={{ color: colors.textSecondary, fontWeight: "500" }}
            >
              Submit another report
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main form
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Submit a report",
          headerBackTitle: "Home",
        }}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Verified identity banner ── */}
        <View
          style={[
            styles.identityBanner,
            { backgroundColor: colors.backgroundGrouped },
          ]}
        >
          <Ionicons name="shield-checkmark" size={16} color="#2E7D32" />
          <AppText size={12} style={{ color: "#2E7D32", flex: 1 }}>
            Verified as{" "}
            <AppText size={12} style={{ fontWeight: "700", color: "#2E7D32" }}>
              {userProfile?.fullName ?? "User"}
            </AppText>
            {" · "}report tied to your Digital ID
          </AppText>
        </View>

        {/* ── Report type selector ── */}
        <View style={styles.section}>
          <AppText size={13} style={styles.sectionLabel}>
            Report type
          </AppText>
          <View style={styles.typeGrid}>
            {REPORT_TYPES.map((type) => {
              const isActive = reportType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typeCard,
                    { backgroundColor: isActive ? type.bg : colors.backgroundGrouped },
                    isActive && {
                      borderColor: type.color,
                      borderWidth: 1.5,
                    },
                  ]}
                  onPress={() => setReportType(type.key)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={type.icon}
                    size={22}
                    color={isActive ? type.color : colors.textSecondary}
                  />
                  <AppText
                    size={12}
                    style={[
                      styles.typeLabel,
                      { color: isActive ? type.color : colors.textSecondary },
                    ]}
                  >
                    {type.label}
                  </AppText>
                  <AppText
                    size={10}
                    style={[
                      styles.typeDesc,
                      { color: isActive ? type.color : colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {type.description}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Incident details ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.backgroundGrouped },
          ]}
        >
          <AppText size={13} style={styles.sectionLabel}>
            Incident details
          </AppText>

          {/* Category picker */}
          <AppText size={12} style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Category
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {CATEGORIES[reportType].map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? activeType.color
                        : colors.background,
                      borderColor: isSelected
                        ? activeType.color
                        : colors.textSecondary + "44",
                    },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <AppText
                    size={12}
                    style={{
                      color: isSelected ? "#fff" : colors.textSecondary,
                      fontWeight: isSelected ? "600" : "400",
                    }}
                  >
                    {cat}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Severity — only for disaster & rescue */}
          {reportType !== "feedback" && (
            <>
              <AppText
                size={12}
                style={[
                  styles.fieldLabel,
                  { color: colors.textSecondary, marginTop: vs(14) },
                ]}
              >
                Severity level
              </AppText>
              <View style={styles.severityRow}>
                {SEVERITY_LEVELS.map((sev) => {
                  const isActive = severity === sev.key;
                  return (
                    <TouchableOpacity
                      key={sev.key}
                      style={[
                        styles.severityBtn,
                        {
                          backgroundColor: isActive ? sev.bg : colors.background,
                          borderColor: isActive
                            ? sev.color
                            : colors.textSecondary + "33",
                        },
                      ]}
                      onPress={() => setSeverity(sev.key)}
                    >
                      <AppText
                        size={12}
                        style={{
                          color: isActive ? sev.color : colors.textSecondary,
                          fontWeight: isActive ? "700" : "400",
                        }}
                      >
                        {sev.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Description */}
          <AppText
            size={12}
            style={[
              styles.fieldLabel,
              { color: colors.textSecondary, marginTop: vs(14) },
            ]}
          >
            Description
          </AppText>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.textSecondary + "33",
              },
            ]}
            placeholder="Describe what happened, when, and who is affected..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* ── Location ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.backgroundGrouped },
          ]}
        >
          <AppText size={13} style={styles.sectionLabel}>
            Location
          </AppText>
          <View style={styles.locationRow}>
            <TextInput
              style={[
                styles.locationInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.textSecondary + "33",
                },
              ]}
              placeholder="Enter address or area..."
              placeholderTextColor={colors.textSecondary}
              value={locationText}
              onChangeText={(v) => {
                setLocationText(v);
                setLocationPinned(false);
              }}
            />
            <TouchableOpacity
              style={[
                styles.gpsBtn,
                {
                  backgroundColor: locationPinned ? "#E8F5E9" : colors.background,
                  borderColor: locationPinned
                    ? "#2E7D32"
                    : colors.textSecondary + "44",
                },
              ]}
              onPress={handleDetectLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name={locationPinned ? "location" : "locate-outline"}
                  size={20}
                  color={locationPinned ? "#2E7D32" : colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>
          {locationPinned && (
            <AppText
              size={11}
              style={{ color: "#2E7D32", marginTop: vs(6) }}
            >
              GPS coordinates saved to report.
            </AppText>
          )}
        </View>

        {/* ── Attachments ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.backgroundGrouped },
          ]}
        >
          <AppText size={13} style={styles.sectionLabel}>
            Photos & evidence
          </AppText>
          <TouchableOpacity
            style={[
              styles.attachZone,
              { borderColor: colors.textSecondary + "55" },
            ]}
            onPress={handleAttachMedia}
            activeOpacity={0.7}
          >
            <Ionicons
              name="cloud-upload-outline"
              size={28}
              color={colors.textSecondary}
            />
            <AppText
              size={13}
              style={{ color: colors.textSecondary, marginTop: vs(6) }}
            >
              Tap to attach photos or videos
            </AppText>
            <AppText size={11} style={{ color: colors.textSecondary + "99" }}>
              JPG, PNG, MP4 · max 20 MB
            </AppText>
          </TouchableOpacity>

          {attachments.length > 0 && (
            <View style={styles.attachList}>
              {attachments.map((file, index) => (
                <View
                  key={index}
                  style={[
                    styles.attachChip,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <Ionicons
                    name="document-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <AppText
                    size={12}
                    style={{ color: colors.text, flex: 1 }}
                    numberOfLines={1}
                  >
                    {file.name}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => handleRemoveAttachment(index)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Submission options ── */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.backgroundGrouped },
          ]}
        >
          <AppText size={13} style={styles.sectionLabel}>
            Submission options
          </AppText>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setIsAnonymous((v) => !v)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isAnonymous ? "checkbox" : "square-outline"}
              size={20}
              color={isAnonymous ? activeType.color : colors.textSecondary}
            />
            <AppText
              size={13}
              style={[styles.checkLabel, { color: colors.text }]}
            >
              Submit anonymously — your IC won't be visible to officers
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setWantsUpdates((v) => !v)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={wantsUpdates ? "checkbox" : "square-outline"}
              size={20}
              color={wantsUpdates ? activeType.color : colors.textSecondary}
            />
            <AppText
              size={13}
              style={[styles.checkLabel, { color: colors.text }]}
            >
              Notify me when my report status changes
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setHasConsented((v) => !v)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={hasConsented ? "checkbox" : "square-outline"}
              size={20}
              color={hasConsented ? activeType.color : colors.textSecondary}
            />
            <AppText
              size={13}
              style={[styles.checkLabel, { color: colors.text }]}
            >
              I confirm this report is accurate and submitted in good faith
            </AppText>
          </TouchableOpacity>
        </View>

        {/* ── Submit row ── */}
        <View style={styles.submitRow}>
          <TouchableOpacity
            style={[styles.btnDraft, { borderColor: colors.textSecondary + "55" }]}
            onPress={() => Alert.alert("Draft saved", "Your report has been saved locally.")}
          >
            <AppText size={14} style={{ color: colors.textSecondary }}>
              Save draft
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnSubmit,
              {
                backgroundColor: hasConsented
                  ? activeType.color
                  : colors.textSecondary + "44",
              },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !hasConsented}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <AppText size={14} style={{ color: "#fff", fontWeight: "600" }}>
                Submit {activeType.label}
              </AppText>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  // Identity banner
  identityBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: vs(12),
    marginBottom: vs(4),
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2E7D32",
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginTop: vs(20),
  },
  sectionLabel: {
    fontWeight: "700",
    marginBottom: vs(10),
  },
  card: {
    marginHorizontal: 16,
    marginTop: vs(16),
    borderRadius: 12,
    padding: 14,
  },
  fieldLabel: {
    fontWeight: "500",
    marginBottom: vs(6),
  },

  // Report type grid
  typeGrid: {
    flexDirection: "row",
    gap: 8,
  },
  typeCard: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
    gap: 4,
  },
  typeLabel: {
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
  },
  typeDesc: {
    textAlign: "center",
    lineHeight: 13,
    opacity: 0.8,
  },

  // Category chips
  chipScroll: {
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },

  // Severity
  severityRow: {
    flexDirection: "row",
    gap: 8,
  },
  severityBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },

  // Description
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 110,
    lineHeight: 22,
  },

  // Location
  locationRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  locationInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    height: 42,
  },
  gpsBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Attachments
  attachZone: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  attachList: {
    marginTop: vs(10),
    gap: 6,
  },
  attachChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
  },

  // Checkboxes
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: vs(12),
  },
  checkLabel: {
    flex: 1,
    lineHeight: 20,
  },

  // Submit
  submitRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: vs(20),
  },
  btnDraft: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSubmit: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // Success
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: vs(12),
  },
  successIcon: {
    marginBottom: vs(8),
  },
  successTitle: {
    fontWeight: "700",
    textAlign: "center",
  },
  successSub: {
    textAlign: "center",
    lineHeight: 22,
  },
  refCard: {
    width: "100%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginVertical: vs(8),
  },
  btnPrimary: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: vs(8),
  },
  btnGhost: {
    paddingVertical: 10,
    alignItems: "center",
  },
});