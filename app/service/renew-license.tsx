import { AppText } from "@/components/common/AppText";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";

import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Animated as RNAnimated,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const JPJ_PORTAL_URL =
  "https://www.jpj.gov.my/en/web/main-site/renew-driving-licence";
const STORAGE_KEY = "offlineLicenseSessions";

// JPJ official rates (2024)
const LICENSE_PLANS = {
  car: {
    label: "Car / Van",
    icon: "car-outline",
    category: "B2 / D",
    durations: [
      { years: 1, fee: 30, label: "1 year — RM 30" },
      { years: 3, fee: 50, label: "3 years — RM 50" },
    ],
  },
  motorcycle: {
    label: "Motorcycle",
    icon: "bicycle-outline",
    category: "B / B2",
    durations: [
      { years: 1, fee: 20, label: "1 year — RM 20" },
      { years: 3, fee: 30, label: "3 years — RM 30" },
    ],
  },
} as const;

type LicenseType = keyof typeof LICENSE_PLANS;
type DeliveryMode = "counter" | "postal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type LicenseSession = {
  token: string;
  icNumber: string;
  licenseType: LicenseType;
  licensePlate?: string;
  durationYears: number;
  fee: string;
  delivery: DeliveryMode;
  currentExpiry: string;
  newExpiry: string;
  createdAt: string;
  expiresAt: string; // token expiry (24h)
  status: "pending" | "synced" | "failed_balance" | "failed" | "expired";
  failReason?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return (
    "OFL-" +
    Array.from(
      { length: 8 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("")
  );
}

function formatIC(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  if (digits.length <= 6) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatExpiry(isoString: string): string {
  return new Date(isoString).toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// NetworkBadge
// ---------------------------------------------------------------------------
function NetworkBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <View
      style={[
        nbStyles.badge,
        { backgroundColor: isOnline ? "#D4F1D4" : "#FFE0B2" },
      ]}
    >
      <View
        style={[
          nbStyles.dot,
          { backgroundColor: isOnline ? "#2E7D32" : "#E65100" },
        ]}
      />
      <AppText
        size={11}
        style={{ color: isOnline ? "#2E7D32" : "#E65100", fontWeight: "600" }}
      >
        {isOnline ? "Online" : "No Internet"}
      </AppText>
    </View>
  );
}
const nbStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

// ---------------------------------------------------------------------------
// SessionRow
// ---------------------------------------------------------------------------
function SessionRow({
  session,
  onRetryOnline,
}: {
  session: LicenseSession;
  onRetryOnline: () => void;
}) {
  const { colors } = useAppContext();

  const statusConfig = {
    synced: {
      bg: "#D4F1D4",
      color: "#2E7D32",
      icon: "checkmark-circle",
      label: "Synced",
    },
    pending: {
      bg: "#FFF3E0",
      color: "#E65100",
      icon: "time-outline",
      label: "Pending",
    },
    failed_balance: {
      bg: "#FFCDD2",
      color: "#C62828",
      icon: "alert-circle",
      label: "Insufficient balance",
    },
    failed: {
      bg: "#FFCDD2",
      color: "#C62828",
      icon: "close-circle",
      label: "Failed",
    },
    expired: {
      bg: "#F5F5F5",
      color: "#9E9E9E",
      icon: "time-outline",
      label: "Expired",
    },
  } as const;

  const cfg = statusConfig[session.status] ?? statusConfig.pending;
  const plan = LICENSE_PLANS[session.licenseType];

  return (
    <View style={[srStyles.row, { backgroundColor: colors.backgroundGrouped }]}>
      <View style={[srStyles.iconBox, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText
          size={12}
          style={{ fontWeight: "700", color: colors.textPrimary }}
        >
          {session.token}
        </AppText>
        <AppText size={11} style={{ color: colors.textSecondary }}>
          {plan.label} · {session.durationYears}yr · RM {session.fee}
        </AppText>
        <AppText size={11} style={{ color: colors.textSecondary }}>
          IC: {session.icNumber}
          {session.licensePlate ? ` · ${session.licensePlate}` : ""}
        </AppText>
        {session.status === "synced" && (
          <AppText size={10} style={{ color: "#2E7D32", marginTop: vs(2) }}>
            New expiry: {formatDate(session.newExpiry)}
          </AppText>
        )}
        {session.status === "failed_balance" && (
          <>
            <AppText size={10} style={{ color: "#C62828", marginTop: vs(2) }}>
              Payment rejected — insufficient balance at sync
            </AppText>
            <TouchableOpacity onPress={onRetryOnline} style={srStyles.retryBtn}>
              <Ionicons name="globe-outline" size={10} color="#185FA5" />
              <AppText
                size={10}
                style={{ color: "#185FA5", fontWeight: "600" }}
              >
                Renew online instead
              </AppText>
            </TouchableOpacity>
          </>
        )}
        {session.status === "failed" && session.failReason && (
          <AppText size={10} style={{ color: "#C62828", marginTop: vs(2) }}>
            {session.failReason}
          </AppText>
        )}
        {session.status === "pending" && (
          <AppText
            size={10}
            style={{ color: colors.textSecondary, marginTop: vs(2) }}
          >
            Token expires {formatExpiry(session.expiresAt)}
          </AppText>
        )}
      </View>
      <View style={[srStyles.pill, { backgroundColor: cfg.bg }]}>
        <AppText size={10} style={{ color: cfg.color, fontWeight: "600" }}>
          {cfg.label}
        </AppText>
      </View>
    </View>
  );
}

const srStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: s(10),
    padding: s(12),
    borderRadius: 8,
    marginBottom: vs(6),
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: vs(2),
  },
  pill: {
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: 10,
    marginTop: vs(2),
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: vs(4),
    alignSelf: "flex-start",
    paddingHorizontal: s(7),
    paddingVertical: vs(3),
    borderRadius: 5,
    backgroundColor: "#E3F2FD",
  },
});

// ---------------------------------------------------------------------------
// OfflineLicenseModal
// ---------------------------------------------------------------------------
type ModalProps = {
  visible: boolean;
  initialType: LicenseType | null;
  onClose: () => void;
  onSave: (session: LicenseSession) => void;
  colors: any;
};

type ModalStep = "form" | "review" | "qr" | "done";

function OfflineLicenseModal({
  visible,
  initialType,
  onClose,
  onSave,
  colors,
}: ModalProps) {
  const [step, setStep] = useState<ModalStep>("form");
  const [licenseType, setLicenseType] = useState<LicenseType>(
    initialType ?? "car",
  );
  const [icNumber, setIcNumber] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(0); // index into durations array
  const [delivery, setDelivery] = useState<DeliveryMode>("counter");
  const [currentExpiry, setCurrentExpiry] = useState("");
  const [session, setSession] = useState<LicenseSession | null>(null);
  const [reminderSet, setReminderSet] = useState(false);

  const progressAnim = useRef(new RNAnimated.Value(0)).current;

  const plan = LICENSE_PLANS[licenseType];
  const chosenDuration = plan.durations[selectedDuration];

  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setStep("form");
        setIcNumber("");
        setLicensePlate("");
        setSelectedDuration(0);
        setDelivery("counter");
        setCurrentExpiry("");
        setSession(null);
        setReminderSet(false);
      }, 300);
    }
  }, [visible]);

  useEffect(() => {
    if (initialType) setLicenseType(initialType);
  }, [initialType]);

  useEffect(() => {
    // reset duration index when type changes
    setSelectedDuration(0);
  }, [licenseType]);

  useEffect(() => {
    const stepMap: Record<ModalStep, number> = {
      form: 0.25,
      review: 0.5,
      qr: 0.75,
      done: 1,
    };
    RNAnimated.timing(progressAnim, {
      toValue: stepMap[step],
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const handleReview = () => {
    if (icNumber.replace(/\D/g, "").length < 12) {
      Alert.alert("Invalid IC", "Please enter a valid 12-digit MyKad number.");
      return;
    }
    if (licenseType === "car" && !licensePlate.trim()) {
      Alert.alert(
        "Missing field",
        "Please enter your vehicle registration number.",
      );
      return;
    }
    if (!currentExpiry.trim()) {
      Alert.alert(
        "Missing field",
        "Please enter your current license expiry date (e.g. 31/12/2024).",
      );
      return;
    }
    setStep("review");
  };

  const handleGenerate = () => {
    const now = new Date();
    const tokenExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // Parse current expiry DD/MM/YYYY
    const parts = currentExpiry.split("/");
    let baseDate = now.toISOString();
    if (parts.length === 3) {
      const parsed = new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0]),
      );
      if (!isNaN(parsed.getTime())) baseDate = parsed.toISOString();
    }
    const newExpiry = addYears(baseDate, chosenDuration.years);

    const s: LicenseSession = {
      token: generateToken(),
      icNumber,
      licenseType,
      licensePlate:
        licenseType === "car" ? licensePlate.trim().toUpperCase() : undefined,
      durationYears: chosenDuration.years,
      fee: chosenDuration.fee.toFixed(2),
      delivery,
      currentExpiry: baseDate,
      newExpiry,
      createdAt: now.toISOString(),
      expiresAt: tokenExpires.toISOString(),
      status: "pending",
    };
    setSession(s);
    setStep("qr");
  };

  const handleConfirm = () => {
    if (session) {
      onSave(session);
      setStep("done");
    }
  };

  const handleSetReminder = async () => {
    if (!session) return;
    try {
      // Store reminder in AsyncStorage — your app's notification service
      // or background task can check this on launch and fire a local alert
      const reminderDate = new Date(session.newExpiry);
      reminderDate.setDate(reminderDate.getDate() - 30);

      const reminders = JSON.parse(
        (await AsyncStorage.getItem("licenseRenewalReminders")) || "[]",
      );
      reminders.push({
        token: session.token,
        licenseType: session.licenseType,
        newExpiry: session.newExpiry,
        remindAt: reminderDate.toISOString(),
        triggered: false,
      });
      await AsyncStorage.setItem(
        "licenseRenewalReminders",
        JSON.stringify(reminders),
      );

      setReminderSet(true);
      Alert.alert(
        "Reminder saved",
        `We'll remind you 30 days before your license expires on ${formatDate(session.newExpiry)}.`,
      );
    } catch (e) {
      console.error("Failed to save reminder:", e);
      Alert.alert("Error", "Could not save reminder. Please try again.");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={mStyles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[mStyles.sheet, { backgroundColor: colors.background }]}>
        <View style={mStyles.handle} />

        {/* Progress bar */}
        <View style={mStyles.progressTrack}>
          <RNAnimated.View
            style={[
              mStyles.progressFill,
              {
                width: progressWidth,
                backgroundColor: step === "done" ? "#2E7D32" : "#185FA5",
              },
            ]}
          />
        </View>

        {/* Step label */}
        <View style={mStyles.stepLabelRow}>
          {(["form", "review", "qr", "done"] as ModalStep[]).map((s, i) => (
            <AppText
              key={s}
              size={10}
              style={{
                color: step === s ? colors.textPrimary : colors.textSecondary,
                fontWeight: step === s ? "700" : "400",
                flex: 1,
                textAlign: "center",
              }}
            >
              {["Details", "Review", "QR Token", "Done"][i]}
            </AppText>
          ))}
        </View>

        {/* ── STEP: FORM ── */}
        {step === "form" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={mStyles.body}>
              <View
                style={[mStyles.offlinePill, { backgroundColor: "#FFF3E0" }]}
              >
                <Ionicons name="wifi-outline" size={12} color="#E65100" />
                <AppText
                  size={11}
                  style={{ color: "#E65100", fontWeight: "600" }}
                >
                  Offline mode
                </AppText>
              </View>
              <AppText
                size={17}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(4),
                }}
              >
                Offline License Renewal
              </AppText>
              <AppText
                size={12}
                style={{
                  color: colors.textSecondary,
                  lineHeight: 18,
                  marginBottom: vs(16),
                }}
              >
                Your details are saved locally and submitted to JPJ
                automatically when you reconnect.
              </AppText>

              {/* License type selector */}
              <AppText
                size={12}
                style={[mStyles.label, { color: colors.textSecondary }]}
              >
                License type
              </AppText>
              <View style={mStyles.typeRow}>
                {(Object.keys(LICENSE_PLANS) as LicenseType[]).map((type) => {
                  const p = LICENSE_PLANS[type];
                  const active = licenseType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        mStyles.typeCard,
                        {
                          backgroundColor: active
                            ? "#E3F2FD"
                            : colors.backgroundGrouped,
                          borderColor: active
                            ? "#185FA5"
                            : colors.border || "#E0E0E0",
                          borderWidth: active ? 1.5 : 1,
                        },
                      ]}
                      onPress={() => setLicenseType(type)}
                    >
                      <Ionicons
                        name={p.icon as any}
                        size={22}
                        color={active ? "#185FA5" : colors.textSecondary}
                      />
                      <AppText
                        size={12}
                        style={{
                          color: active ? "#185FA5" : colors.textPrimary,
                          fontWeight: "600",
                          marginTop: vs(4),
                        }}
                      >
                        {p.label}
                      </AppText>
                      <AppText
                        size={10}
                        style={{
                          color: active ? "#185FA5" : colors.textSecondary,
                        }}
                      >
                        Class {p.category}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Duration selector */}
              <AppText
                size={12}
                style={[mStyles.label, { color: colors.textSecondary }]}
              >
                Renewal duration
              </AppText>
              <View style={mStyles.durationRow}>
                {plan.durations.map((d, i) => {
                  const active = selectedDuration === i;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        mStyles.durationCard,
                        {
                          backgroundColor: active
                            ? "#185FA5"
                            : colors.backgroundGrouped,
                          borderColor: active
                            ? "#185FA5"
                            : colors.border || "#E0E0E0",
                        },
                      ]}
                      onPress={() => setSelectedDuration(i)}
                    >
                      <AppText
                        size={20}
                        style={{
                          fontWeight: "700",
                          color: active ? "#fff" : colors.textPrimary,
                        }}
                      >
                        {d.years}yr
                      </AppText>
                      <AppText
                        size={13}
                        style={{
                          color: active ? "#B3D9FF" : colors.textSecondary,
                          marginTop: vs(2),
                        }}
                      >
                        RM {d.fee}
                      </AppText>
                      {d.years === 3 && (
                        <View
                          style={[
                            mStyles.savePill,
                            {
                              backgroundColor: active ? "#ffffff33" : "#E8F5E9",
                            },
                          ]}
                        >
                          <AppText
                            size={9}
                            style={{
                              color: active ? "#fff" : "#2E7D32",
                              fontWeight: "700",
                            }}
                          >
                            Best value
                          </AppText>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* IC Number */}
              <AppText
                size={12}
                style={[mStyles.label, { color: colors.textSecondary }]}
              >
                MyKad / IC number
              </AppText>
              <TextInput
                style={[
                  mStyles.input,
                  {
                    backgroundColor: colors.backgroundGrouped,
                    color: colors.textPrimary,
                    borderColor: colors.border || "#E0E0E0",
                  },
                ]}
                placeholder="e.g. 901231-14-5678"
                placeholderTextColor={colors.textSecondary}
                value={icNumber}
                onChangeText={(t) => setIcNumber(formatIC(t))}
                keyboardType="numeric"
                maxLength={14}
              />

              {/* License plate (car only) */}
              {licenseType === "car" && (
                <>
                  <AppText
                    size={12}
                    style={[mStyles.label, { color: colors.textSecondary }]}
                  >
                    Vehicle registration no.
                  </AppText>
                  <TextInput
                    style={[
                      mStyles.input,
                      {
                        backgroundColor: colors.backgroundGrouped,
                        color: colors.textPrimary,
                        borderColor: colors.border || "#E0E0E0",
                      },
                    ]}
                    placeholder="e.g. WKL 1234"
                    placeholderTextColor={colors.textSecondary}
                    value={licensePlate}
                    onChangeText={(t) => setLicensePlate(t.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </>
              )}

              {/* Current expiry */}
              <AppText
                size={12}
                style={[mStyles.label, { color: colors.textSecondary }]}
              >
                Current license expiry date
              </AppText>
              <TextInput
                style={[
                  mStyles.input,
                  {
                    backgroundColor: colors.backgroundGrouped,
                    color: colors.textPrimary,
                    borderColor: colors.border || "#E0E0E0",
                  },
                ]}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={colors.textSecondary}
                value={currentExpiry}
                onChangeText={setCurrentExpiry}
                keyboardType="numeric"
              />

              {/* Delivery preference */}
              <AppText
                size={12}
                style={[mStyles.label, { color: colors.textSecondary }]}
              >
                Delivery preference
              </AppText>
              <View style={mStyles.deliveryRow}>
                {(
                  [
                    {
                      key: "counter",
                      icon: "business-outline",
                      label: "Collect at JPJ counter",
                      sub: "Bring IC on collection day",
                    },
                    {
                      key: "postal",
                      icon: "mail-outline",
                      label: "Postal delivery",
                      sub: "Delivered within 7–14 days",
                    },
                  ] as {
                    key: DeliveryMode;
                    icon: string;
                    label: string;
                    sub: string;
                  }[]
                ).map(({ key, icon, label, sub }) => {
                  const active = delivery === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        mStyles.deliveryCard,
                        {
                          backgroundColor: active
                            ? "#E3F2FD"
                            : colors.backgroundGrouped,
                          borderColor: active
                            ? "#185FA5"
                            : colors.border || "#E0E0E0",
                          borderWidth: active ? 1.5 : 1,
                        },
                      ]}
                      onPress={() => setDelivery(key)}
                    >
                      <View style={mStyles.deliveryTop}>
                        <Ionicons
                          name={icon as any}
                          size={16}
                          color={active ? "#185FA5" : colors.textSecondary}
                        />
                        {active && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#185FA5"
                          />
                        )}
                      </View>
                      <AppText
                        size={12}
                        style={{
                          color: active ? "#185FA5" : colors.textPrimary,
                          fontWeight: "600",
                          marginTop: vs(4),
                        }}
                      >
                        {label}
                      </AppText>
                      <AppText
                        size={10}
                        style={{
                          color: active ? "#185FA5" : colors.textSecondary,
                          marginTop: vs(2),
                          lineHeight: 14,
                        }}
                      >
                        {sub}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={mStyles.footer}>
              <TouchableOpacity
                style={[
                  mStyles.btn,
                  { borderColor: colors.border || "#E0E0E0" },
                ]}
                onPress={onClose}
              >
                <AppText
                  size={14}
                  style={{ color: colors.textSecondary, fontWeight: "600" }}
                >
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  mStyles.btn,
                  mStyles.btnPrimary,
                  { backgroundColor: "#185FA5" },
                ]}
                onPress={handleReview}
              >
                <AppText size={14} style={{ color: "#fff", fontWeight: "600" }}>
                  Review details
                </AppText>
                <Ionicons name="arrow-forward" size={15} color="#fff" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ── STEP: REVIEW ── */}
        {step === "review" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={mStyles.body}>
              <AppText
                size={17}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(4),
                }}
              >
                Review your details
              </AppText>
              <AppText
                size={12}
                style={{
                  color: colors.textSecondary,
                  lineHeight: 18,
                  marginBottom: vs(16),
                }}
              >
                Please verify everything before generating your offline token.
              </AppText>

              {/* Summary card */}
              <View
                style={[
                  mStyles.reviewCard,
                  { backgroundColor: colors.backgroundGrouped },
                ]}
              >
                {[
                  {
                    label: "License type",
                    value: `${plan.label} (Class ${plan.category})`,
                  },
                  { label: "IC number", value: icNumber },
                  ...(licenseType === "car"
                    ? [{ label: "Vehicle plate", value: licensePlate }]
                    : []),
                  {
                    label: "Duration",
                    value: `${chosenDuration.years} year${chosenDuration.years > 1 ? "s" : ""}`,
                  },
                  {
                    label: "Fee",
                    value: `RM ${chosenDuration.fee.toFixed(2)}`,
                  },
                  { label: "Current expiry", value: currentExpiry },
                  {
                    label: "Delivery",
                    value:
                      delivery === "counter"
                        ? "Collect at JPJ counter"
                        : "Postal delivery",
                  },
                ].map(({ label, value }) => (
                  <View key={label} style={mStyles.reviewRow}>
                    <AppText
                      size={12}
                      style={{ color: colors.textSecondary, flex: 1 }}
                    >
                      {label}
                    </AppText>
                    <AppText
                      size={12}
                      style={{
                        color: colors.textPrimary,
                        fontWeight: "600",
                        flex: 1,
                        textAlign: "right",
                      }}
                    >
                      {value}
                    </AppText>
                  </View>
                ))}
              </View>

              {/* Expiry preview */}
              {(() => {
                const parts = currentExpiry.split("/");
                let newExp: Date | null = null;
                if (parts.length === 3) {
                  const base = new Date(
                    parseInt(parts[2]),
                    parseInt(parts[1]) - 1,
                    parseInt(parts[0]),
                  );
                  if (!isNaN(base.getTime())) {
                    newExp = new Date(base);
                    newExp.setFullYear(
                      newExp.getFullYear() + chosenDuration.years,
                    );
                  }
                }
                return newExp ? (
                  <View
                    style={[
                      mStyles.expiryPreview,
                      { backgroundColor: "#E8F5E9", borderColor: "#A5D6A7" },
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#2E7D32"
                    />
                    <View style={{ flex: 1 }}>
                      <AppText
                        size={11}
                        style={{ color: "#2E7D32", fontWeight: "700" }}
                      >
                        New expiry after renewal
                      </AppText>
                      <AppText
                        size={13}
                        style={{
                          color: "#1B5E20",
                          fontWeight: "700",
                          marginTop: vs(2),
                        }}
                      >
                        {formatDate(newExp.toISOString())}
                      </AppText>
                    </View>
                  </View>
                ) : null;
              })()}

              <View
                style={[
                  mStyles.noticeBox,
                  { backgroundColor: "#FFF8E1", borderColor: "#FFE082" },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={14}
                  color="#F57F17"
                />
                <AppText
                  size={11}
                  style={{ color: "#F57F17", flex: 1, lineHeight: 16 }}
                >
                  This token is valid for 24 hours. Please sync online or
                  present at a JPJ counter before it expires.
                </AppText>
              </View>
            </View>

            <View style={mStyles.footer}>
              <TouchableOpacity
                style={[
                  mStyles.btn,
                  { borderColor: colors.border || "#E0E0E0" },
                ]}
                onPress={() => setStep("form")}
              >
                <Ionicons
                  name="arrow-back"
                  size={15}
                  color={colors.textSecondary}
                />
                <AppText
                  size={14}
                  style={{ color: colors.textSecondary, fontWeight: "600" }}
                >
                  Edit
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  mStyles.btn,
                  mStyles.btnPrimary,
                  { backgroundColor: "#BA7517" },
                ]}
                onPress={handleGenerate}
              >
                <Ionicons name="qr-code-outline" size={15} color="#fff" />
                <AppText size={14} style={{ color: "#fff", fontWeight: "600" }}>
                  Generate QR token
                </AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ── STEP: QR ── */}
        {step === "qr" && session && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={mStyles.body}>
              <AppText
                size={17}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(4),
                }}
              >
                One-time renewal token
              </AppText>
              <AppText
                size={12}
                style={{
                  color: colors.textSecondary,
                  lineHeight: 18,
                  marginBottom: vs(16),
                }}
              >
                Show this QR at the JPJ counter or let it sync automatically
                when back online.
              </AppText>

              <View style={mStyles.qrCenter}>
                <View
                  style={[
                    mStyles.qrFrame,
                    { borderColor: colors.border || "#E0E0E0" },
                  ]}
                >
                  <QRCode
                    value={JSON.stringify({
                      token: session.token,
                      ic: session.icNumber,
                      type: session.licenseType,
                      plate: session.licensePlate,
                      duration: session.durationYears,
                      fee: session.fee,
                      delivery: session.delivery,
                      newExpiry: session.newExpiry,
                    })}
                    size={164}
                    backgroundColor="transparent"
                    color={colors.textPrimary}
                  />
                </View>

                <View
                  style={[
                    mStyles.tokenBox,
                    { backgroundColor: colors.backgroundGrouped },
                  ]}
                >
                  <AppText
                    size={11}
                    style={{ color: colors.textSecondary, marginBottom: vs(2) }}
                  >
                    Token ID
                  </AppText>
                  <AppText
                    size={16}
                    style={{
                      fontWeight: "700",
                      color: colors.textPrimary,
                      letterSpacing: 2,
                    }}
                  >
                    {session.token}
                  </AppText>
                </View>

                {/* Info pills */}
                <View style={mStyles.pillsRow}>
                  {[
                    plan.label,
                    `${session.durationYears}yr`,
                    `RM ${session.fee}`,
                    delivery === "counter" ? "Counter pickup" : "Postal",
                    "Expires 24h",
                  ].map((p, i) => (
                    <View
                      key={i}
                      style={[
                        mStyles.infoPill,
                        {
                          backgroundColor:
                            i === 4 ? "#FFF3E0" : colors.backgroundGrouped,
                          borderColor:
                            i === 4 ? "#FFE082" : colors.border || "#E0E0E0",
                        },
                      ]}
                    >
                      <AppText
                        size={10}
                        style={{
                          color: i === 4 ? "#E65100" : colors.textSecondary,
                          fontWeight: "500",
                        }}
                      >
                        {p}
                      </AppText>
                    </View>
                  ))}
                </View>

                {/* New expiry callout */}
                <View
                  style={[
                    mStyles.expiryPreview,
                    {
                      backgroundColor: "#E8F5E9",
                      borderColor: "#A5D6A7",
                      width: "100%",
                    },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={14} color="#2E7D32" />
                  <AppText size={11} style={{ color: "#2E7D32" }}>
                    New expiry:{" "}
                    <AppText
                      size={11}
                      style={{ fontWeight: "700", color: "#1B5E20" }}
                    >
                      {formatDate(session.newExpiry)}
                    </AppText>
                  </AppText>
                </View>

                <AppText
                  size={11}
                  style={{
                    color: colors.textSecondary,
                    textAlign: "center",
                    lineHeight: 16,
                  }}
                >
                  Session stored locally. Syncs automatically when internet is
                  restored.
                </AppText>
              </View>
            </View>

            <View style={mStyles.footer}>
              <TouchableOpacity
                style={[
                  mStyles.btn,
                  { borderColor: colors.border || "#E0E0E0" },
                ]}
                onPress={onClose}
              >
                <AppText
                  size={14}
                  style={{ color: colors.textSecondary, fontWeight: "600" }}
                >
                  Close
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  mStyles.btn,
                  mStyles.btnPrimary,
                  { backgroundColor: "#185FA5" },
                ]}
                onPress={handleConfirm}
              >
                <Ionicons name="save-outline" size={15} color="#fff" />
                <AppText size={14} style={{ color: "#fff", fontWeight: "600" }}>
                  Save session
                </AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ── STEP: DONE ── */}
        {step === "done" && session && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={[mStyles.body, { alignItems: "center" }]}>
              <View style={[mStyles.doneIcon, { backgroundColor: "#D4F1D4" }]}>
                <Ionicons name="checkmark" size={32} color="#2E7D32" />
              </View>
              <AppText
                size={18}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(8),
                }}
              >
                Session saved
              </AppText>
              <AppText
                size={13}
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  lineHeight: 20,
                  marginBottom: vs(4),
                }}
              >
                Token{" "}
                <AppText
                  size={13}
                  style={{ fontWeight: "700", color: colors.textPrimary }}
                >
                  {session.token}
                </AppText>{" "}
                is queued for your {plan.label} license renewal (RM{" "}
                {session.fee}).
              </AppText>
              <AppText
                size={12}
                style={{
                  color: colors.textSecondary,
                  textAlign: "center",
                  lineHeight: 18,
                  marginBottom: vs(20),
                }}
              >
                It will submit to JPJ automatically when you reconnect.
              </AppText>

              {/* Set reminder CTA */}
              <TouchableOpacity
                style={[
                  mStyles.reminderBtn,
                  {
                    backgroundColor: reminderSet ? "#E8F5E9" : "#E3F2FD",
                    borderColor: reminderSet ? "#A5D6A7" : "#90CAF9",
                  },
                ]}
                onPress={handleSetReminder}
                disabled={reminderSet}
              >
                <Ionicons
                  name={
                    reminderSet ? "checkmark-circle" : "notifications-outline"
                  }
                  size={16}
                  color={reminderSet ? "#2E7D32" : "#185FA5"}
                />
                <View style={{ flex: 1 }}>
                  <AppText
                    size={13}
                    style={{
                      fontWeight: "600",
                      color: reminderSet ? "#2E7D32" : "#185FA5",
                    }}
                  >
                    {reminderSet ? "Reminder set!" : "Set renewal reminder"}
                  </AppText>
                  <AppText
                    size={11}
                    style={{
                      color: reminderSet ? "#2E7D32" : "#185FA5",
                      lineHeight: 15,
                    }}
                  >
                    {reminderSet
                      ? `We'll notify you 30 days before ${formatDate(session.newExpiry)}`
                      : `Get notified 30 days before your new expiry (${formatDate(session.newExpiry)})`}
                  </AppText>
                </View>
              </TouchableOpacity>
            </View>

            <View style={mStyles.footer}>
              <TouchableOpacity
                style={[
                  mStyles.btn,
                  mStyles.btnPrimary,
                  { backgroundColor: "#185FA5", flex: 1 },
                ]}
                onPress={onClose}
              >
                <AppText size={14} style={{ color: "#fff", fontWeight: "600" }}>
                  Done
                </AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const mStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
    paddingBottom: 32,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D1D6",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "#F0F0F0",
    marginHorizontal: s(16),
    borderRadius: 2,
    marginBottom: vs(4),
    overflow: "hidden",
  },
  progressFill: { height: 3, borderRadius: 2 },
  stepLabelRow: {
    flexDirection: "row",
    paddingHorizontal: s(16),
    marginBottom: vs(16),
  },
  body: { paddingHorizontal: s(16), paddingBottom: vs(8) },
  offlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: 10,
    marginBottom: vs(8),
  },
  label: { fontWeight: "500", marginBottom: vs(6), marginTop: vs(14) },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    fontSize: 14,
  },
  typeRow: { flexDirection: "row", gap: s(10) },
  typeCard: { flex: 1, borderRadius: 10, padding: s(14), alignItems: "center" },
  durationRow: { flexDirection: "row", gap: s(10) },
  durationCard: {
    flex: 1,
    borderRadius: 10,
    padding: s(14),
    alignItems: "center",
    borderWidth: 1,
  },
  savePill: {
    marginTop: vs(6),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: 6,
  },
  deliveryRow: { flexDirection: "row", gap: s(10) },
  deliveryCard: { flex: 1, borderRadius: 10, padding: s(12) },
  deliveryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    gap: s(10),
    paddingHorizontal: s(16),
    marginTop: vs(16),
  },
  btn: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: s(6),
  },
  btnPrimary: { borderWidth: 0 },
  reviewCard: { borderRadius: 10, padding: s(14), marginBottom: vs(12) },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(7),
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5EA",
  },
  expiryPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
    padding: s(12),
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: vs(10),
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: s(8),
    padding: s(10),
    borderRadius: 8,
    borderWidth: 1,
    marginTop: vs(4),
  },
  qrCenter: { alignItems: "center", gap: vs(14) },
  qrFrame: { padding: s(14), borderWidth: 1, borderRadius: 14 },
  tokenBox: {
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingVertical: vs(10),
    borderRadius: 8,
    width: "100%",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s(6),
    justifyContent: "center",
  },
  infoPill: {
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: 10,
    borderWidth: 1,
  },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vs(16),
  },
  reminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
    padding: s(14),
    borderRadius: 10,
    borderWidth: 1,
    width: "100%",
  },
});

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function RenewLicensePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();
  const { t } = useTranslation();

  // Offline state
  const [isOnline, setIsOnline] = useState(true);
  const [sessions, setSessions] = useState<LicenseSession[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [initialLicenseType, setInitialLicenseType] =
    useState<LicenseType | null>(null);

  // Demo simulator
  const [simMode, setSimMode] = useState(false);
  const [simOnline, setSimOnline] = useState(false);
  const simToggleAnim = useRef(new RNAnimated.Value(0)).current;

  const effectiveOnline = simMode ? simOnline : isOnline;

  const titleAnim = useFadeInUp(stagger(0, 100));
  const descAnim = useFadeInUp(stagger(1, 100));
  const carAnim = useFadeInUp(stagger(2, 100));
  const motoAnim = useFadeInUp(stagger(3, 100));
  const infoAnim = useFadeInUp(stagger(4, 100));
  const pendingAnim = useFadeInUp(stagger(5, 100));

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);
      if (connected && !simMode) syncSessions();
    });
    return unsub;
  }, [simMode]);

  const loadSessions = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: LicenseSession[] = JSON.parse(raw);
        const now = new Date();
        const updated = parsed.map((s) =>
          s.status === "pending" && new Date(s.expiresAt) < now
            ? { ...s, status: "expired" as const }
            : s,
        );
        setSessions(updated);
        if (updated.some((s) => s.status === "pending")) setShowPending(true);
      }
    } catch (e) {
      console.error("Failed to load sessions:", e);
    }
  };

  const saveSession = async (session: LicenseSession) => {
    try {
      const updated = [...sessions, session];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSessions(updated);
      setShowPending(true);
    } catch (e) {
      console.error("Failed to save session:", e);
    }
  };

  const syncSessions = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored: LicenseSession[] = JSON.parse(raw);
    const hasPending = stored.some((s) => s.status === "pending");
    if (!hasPending) return;

    setIsSyncing(true);
    try {
      // ── REPLACE with real JPJ API call ──
      // e.g. const result = await api.post('/jpj/license-renewal/sync', { sessions: pending });
      await new Promise((r) => setTimeout(r, 2000));

      // Demo: all fees are small (RM 20–50), so all succeed in simulation
      // In production, map API response status per token
      const synced = stored.map((s) =>
        s.status === "pending" ? { ...s, status: "synced" as const } : s,
      );
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
      setSessions(synced);
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSimNetwork = () => {
    const next = !simOnline;
    setSimOnline(next);
    RNAnimated.timing(simToggleAnim, {
      toValue: next ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
    if (next) syncSessions();
  };

  const simThumbPos = simToggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });
  const simTrackColor = simToggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFCC80", "#A5D6A7"],
  });

  const pendingCount = sessions.filter((s) => s.status === "pending").length;

  const openModal = (type: LicenseType) => {
    setInitialLicenseType(type);
    setModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
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
          {t("renewLicense")}
        </AppText>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={{ padding: s(16) }}>
          {/* ── DEMO SIMULATOR BAR ── */}
          <Animated.View style={[{ marginBottom: vs(10) }, titleAnim]}>
            <View
              style={[
                styles.simBar,
                {
                  backgroundColor: colors.backgroundGrouped,
                  borderColor: colors.border || "#E0E0E0",
                },
              ]}
            >
              <View style={styles.simBarLeft}>
                <View style={[styles.simDot, { backgroundColor: "#9C6FE4" }]} />
                <AppText
                  size={11}
                  style={{ color: colors.textSecondary, fontWeight: "600" }}
                >
                  DEMO
                </AppText>
                <AppText size={11} style={{ color: colors.textSecondary }}>
                  {simMode
                    ? simOnline
                      ? "Simulating: Online"
                      : "Simulating: Offline"
                    : "Using real network"}
                </AppText>
              </View>
              <View style={styles.simBarRight}>
                <TouchableOpacity
                  style={[
                    styles.simSmallBtn,
                    {
                      backgroundColor: simMode
                        ? "#EDE7F6"
                        : colors.backgroundGrouped,
                      borderColor: simMode
                        ? "#9C6FE4"
                        : colors.border || "#E0E0E0",
                    },
                  ]}
                  onPress={() => {
                    setSimMode(!simMode);
                    if (!simMode) {
                      setSimOnline(false);
                      simToggleAnim.setValue(0);
                    }
                  }}
                >
                  <AppText
                    size={10}
                    style={{
                      color: simMode ? "#6A1B9A" : colors.textSecondary,
                      fontWeight: "600",
                    }}
                  >
                    {simMode ? "Exit sim" : "Simulate"}
                  </AppText>
                </TouchableOpacity>
                {simMode && (
                  <TouchableOpacity
                    style={styles.simToggleWrap}
                    onPress={toggleSimNetwork}
                    activeOpacity={0.8}
                  >
                    <RNAnimated.View
                      style={[
                        styles.simTrack,
                        { backgroundColor: simTrackColor },
                      ]}
                    >
                      <RNAnimated.View
                        style={[styles.simThumb, { left: simThumbPos }]}
                      />
                    </RNAnimated.View>
                    <AppText
                      size={10}
                      style={{
                        color: colors.textSecondary,
                        fontWeight: "600",
                        marginLeft: s(5),
                      }}
                    >
                      {simOnline ? "Online" : "Offline"}
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Network status row */}
          <Animated.View style={[{ marginBottom: vs(12) }, titleAnim]}>
            <View style={styles.networkRow}>
              <NetworkBadge isOnline={effectiveOnline} />
              {isSyncing && (
                <View style={styles.syncRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <AppText size={11} style={{ color: colors.textSecondary }}>
                    Syncing with JPJ...
                  </AppText>
                </View>
              )}
              {!isSyncing && pendingCount > 0 && (
                <TouchableOpacity onPress={() => setShowPending(!showPending)}>
                  <View
                    style={[
                      styles.pendingBadge,
                      { backgroundColor: "#FFF3E0" },
                    ]}
                  >
                    <AppText
                      size={11}
                      style={{ color: "#E65100", fontWeight: "600" }}
                    >
                      {pendingCount} pending
                    </AppText>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View style={titleAnim}>
            <AppText
              size={18}
              style={{
                fontWeight: "700",
                marginBottom: vs(4),
                color: colors.textPrimary,
              }}
            >
              Driving License Renewal
            </AppText>
          </Animated.View>

          <Animated.View style={descAnim}>
            <AppText
              size={13}
              style={{
                color: colors.textSecondary,
                lineHeight: 20,
                marginBottom: vs(16),
              }}
            >
              Renew your driving license online or generate an offline token
              when you have no internet access.
            </AppText>
          </Animated.View>

          {/* JPJ fee info banner */}
          <Animated.View style={[infoAnim, { marginBottom: vs(16) }]}>
            <View
              style={[
                styles.feesBanner,
                { backgroundColor: "#E3F2FD", borderColor: "#90CAF9" },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={15}
                color="#185FA5"
              />
              <View style={{ flex: 1 }}>
                <AppText
                  size={12}
                  style={{
                    fontWeight: "700",
                    color: "#185FA5",
                    marginBottom: vs(4),
                  }}
                >
                  JPJ official renewal fees
                </AppText>
                <AppText size={11} style={{ color: "#185FA5", lineHeight: 17 }}>
                  Car / Van (B2, D): RM 30 (1yr) · RM 50 (3yr){"\n"}
                  Motorcycle (B, B2): RM 20 (1yr) · RM 30 (3yr)
                </AppText>
              </View>
            </View>
          </Animated.View>

          {/* Car license card */}
          <Animated.View style={[carAnim, { marginBottom: vs(12) }]}>
            <View
              style={[
                styles.licenseCard,
                { backgroundColor: colors.backgroundGrouped },
              ]}
            >
              <View style={styles.licenseCardTop}>
                <View
                  style={[
                    styles.licenseIconBox,
                    { backgroundColor: "#E3F2FD" },
                  ]}
                >
                  <Ionicons name="car-outline" size={22} color="#185FA5" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText
                    size={15}
                    style={{ fontWeight: "700", color: colors.textPrimary }}
                  >
                    Car / Van License
                  </AppText>
                  <AppText size={11} style={{ color: colors.textSecondary }}>
                    Class B2, D · RM 30 / RM 50
                  </AppText>
                </View>
              </View>
              <View style={styles.licenseCardBtns}>
                <TouchableOpacity
                  style={[
                    styles.licenseBtn,
                    {
                      backgroundColor: effectiveOnline
                        ? colors.primary
                        : "#C7C7CC",
                      opacity: effectiveOnline ? 1 : 0.7,
                    },
                  ]}
                  onPress={() =>
                    effectiveOnline && Linking.openURL(JPJ_PORTAL_URL)
                  }
                  disabled={!effectiveOnline}
                >
                  <Ionicons name="globe-outline" size={14} color="#fff" />
                  <AppText
                    size={12}
                    style={{ color: "#fff", fontWeight: "600" }}
                  >
                    Renew Online
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.licenseBtn, styles.licenseBtnOffline]}
                  onPress={() => openModal("car")}
                >
                  <Ionicons name="wifi-outline" size={14} color="#854F0B" />
                  <AppText
                    size={12}
                    style={{ color: "#854F0B", fontWeight: "600" }}
                  >
                    Offline Token
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Motorcycle license card */}
          <Animated.View style={[motoAnim, { marginBottom: vs(20) }]}>
            <View
              style={[
                styles.licenseCard,
                { backgroundColor: colors.backgroundGrouped },
              ]}
            >
              <View style={styles.licenseCardTop}>
                <View
                  style={[
                    styles.licenseIconBox,
                    { backgroundColor: "#FFF3E0" },
                  ]}
                >
                  <Ionicons name="bicycle-outline" size={22} color="#BA7517" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText
                    size={15}
                    style={{ fontWeight: "700", color: colors.textPrimary }}
                  >
                    Motorcycle License
                  </AppText>
                  <AppText size={11} style={{ color: colors.textSecondary }}>
                    Class B, B2 · RM 20 / RM 30
                  </AppText>
                </View>
              </View>
              <View style={styles.licenseCardBtns}>
                <TouchableOpacity
                  style={[
                    styles.licenseBtn,
                    {
                      backgroundColor: effectiveOnline
                        ? colors.primary
                        : "#C7C7CC",
                      opacity: effectiveOnline ? 1 : 0.7,
                    },
                  ]}
                  onPress={() =>
                    effectiveOnline && Linking.openURL(JPJ_PORTAL_URL)
                  }
                  disabled={!effectiveOnline}
                >
                  <Ionicons name="globe-outline" size={14} color="#fff" />
                  <AppText
                    size={12}
                    style={{ color: "#fff", fontWeight: "600" }}
                  >
                    Renew Online
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.licenseBtn, styles.licenseBtnOffline]}
                  onPress={() => openModal("motorcycle")}
                >
                  <Ionicons name="wifi-outline" size={14} color="#854F0B" />
                  <AppText
                    size={12}
                    style={{ color: "#854F0B", fontWeight: "600" }}
                  >
                    Offline Token
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Pending sessions */}
          {(showPending || sessions.length > 0) && sessions.length > 0 && (
            <Animated.View style={pendingAnim}>
              <TouchableOpacity
                style={styles.pendingHeader}
                onPress={() => setShowPending(!showPending)}
              >
                <AppText
                  size={14}
                  style={{ fontWeight: "700", color: colors.textPrimary }}
                >
                  Offline Sessions ({sessions.length})
                </AppText>
                <Ionicons
                  name={showPending ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {showPending &&
                sessions.map((s) => (
                  <SessionRow
                    key={s.token}
                    session={s}
                    onRetryOnline={() => Linking.openURL(JPJ_PORTAL_URL)}
                  />
                ))}
            </Animated.View>
          )}

          {/* Important notes */}
          <Animated.View style={infoAnim}>
            <AppText
              size={13}
              style={{
                fontWeight: "700",
                color: colors.textPrimary,
                marginBottom: vs(10),
              }}
            >
              Important notes
            </AppText>
            {[
              {
                icon: "alert-circle-outline",
                color: "#E65100",
                text: "Your license must not be expired for more than 3 years to renew online.",
              },
              {
                icon: "shield-checkmark-outline",
                color: "#185FA5",
                text: "Bring your MyKad on collection day if choosing counter pickup.",
              },
              {
                icon: "time-outline",
                color: "#BA7517",
                text: "Offline tokens are valid for 24 hours and auto-sync when reconnected.",
              },
              {
                icon: "mail-outline",
                color: "#2E7D32",
                text: "Postal delivery takes 7–14 working days. Ensure your address is updated with JPJ.",
              },
            ].map(({ icon, color, text }, i) => (
              <View
                key={i}
                style={[
                  styles.noteRow,
                  { backgroundColor: colors.backgroundGrouped },
                ]}
              >
                <Ionicons name={icon as any} size={16} color={color} />
                <AppText
                  size={12}
                  style={{
                    color: colors.textSecondary,
                    flex: 1,
                    lineHeight: 18,
                  }}
                >
                  {text}
                </AppText>
              </View>
            ))}
          </Animated.View>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Offline Modal */}
      <OfflineLicenseModal
        visible={modalVisible}
        initialType={initialLicenseType}
        onClose={() => setModalVisible(false)}
        onSave={saveSession}
        colors={colors}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Page Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  networkRow: { flexDirection: "row", alignItems: "center", gap: s(10) },
  syncRow: { flexDirection: "row", alignItems: "center", gap: s(6) },
  pendingBadge: {
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
    borderRadius: 10,
  },
  pendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(8),
  },
  feesBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: s(10),
    padding: s(12),
    borderRadius: 10,
    borderWidth: 1,
  },
  licenseCard: { borderRadius: 12, padding: s(14) },
  licenseCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(12),
    marginBottom: vs(14),
  },
  licenseIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  licenseCardBtns: { flexDirection: "row", gap: s(10) },
  licenseBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
    paddingVertical: vs(10),
    borderRadius: 8,
  },
  licenseBtnOffline: {
    backgroundColor: "#FFF3E0",
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: s(10),
    padding: s(12),
    borderRadius: 8,
    marginBottom: vs(8),
  },
  // Simulator bar
  simBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  simBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    flex: 1,
  },
  simBarRight: { flexDirection: "row", alignItems: "center", gap: s(8) },
  simDot: { width: 6, height: 6, borderRadius: 3 },
  simSmallBtn: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: 6,
    borderWidth: 1,
  },
  simToggleWrap: { flexDirection: "row", alignItems: "center" },
  simTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    position: "relative",
  },
  simThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    top: 2,
    elevation: 2,
  },
});
