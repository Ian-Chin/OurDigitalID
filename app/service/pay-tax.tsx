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
  View
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import YoutubePlayer from "react-native-youtube-iframe";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REDIRECT_URL =
  "https://byrhasil.hasil.gov.my/HITS_EP/PaymentOption?lang=EN";
const STORAGE_KEY = "offlineTaxSessions";

const PAYMENT_TYPES = [
  "Income tax (CP500)",
  "Balance of tax (CP600)",
  "RPGT",
  "Stamp duty",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type OfflineSession = {
  token: string;
  ref: string;
  amount: string;
  paymentType: string;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "synced" | "expired" | "failed_balance" | "failed";
  failReason?: string;
};

// ---------------------------------------------------------------------------
// Ceiling rules (Bank Negara / LHDN offline payment guidelines)
// ---------------------------------------------------------------------------
const OFFLINE_HARD_CEILING = 10000; // RM — absolute block
const OFFLINE_SOFT_WARNING = 5000; // RM — show caution banner but allow

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `OFP-${random}`;
}

function formatExpiry(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Pill badge showing network status */
function NetworkBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <View
      style={[
        networkStyles.badge,
        { backgroundColor: isOnline ? "#D4F1D4" : "#FFE0B2" },
      ]}
    >
      <View
        style={[
          networkStyles.dot,
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

const networkStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

/** Single pending session row */
function SessionRow({ session }: { session: OfflineSession }) {
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

  return (
    <View
      style={[sessionStyles.row, { backgroundColor: colors.backgroundGrouped }]}
    >
      <View style={[sessionStyles.iconBox, { backgroundColor: cfg.bg }]}>
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
          {session.ref} · RM {session.amount}
        </AppText>
        {session.status === "failed_balance" && (
          <AppText size={10} style={{ color: "#C62828", marginTop: vs(2) }}>
            Payment rejected — please pay via online portal
          </AppText>
        )}
        {session.status === "failed_balance" && (
          <TouchableOpacity
            onPress={() => Linking.openURL(REDIRECT_URL)}
            style={[failedCtaStyle.btn]}
          >
            <Ionicons name="globe-outline" size={10} color="#185FA5" />
            <AppText size={10} style={{ color: "#185FA5", fontWeight: "600" }}>
              Pay online instead
            </AppText>
          </TouchableOpacity>
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
            Expires {formatExpiry(session.expiresAt)}
          </AppText>
        )}
      </View>
      <View style={[sessionStyles.statusPill, { backgroundColor: cfg.bg }]}>
        <AppText size={10} style={{ color: cfg.color, fontWeight: "600" }}>
          {cfg.label}
        </AppText>
      </View>
    </View>
  );
}

const failedCtaStyle = StyleSheet.create({
  btn: {
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

const sessionStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  statusPill: {
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: 10,
  },
});

// ---------------------------------------------------------------------------
// Offline Payment Modal
// ---------------------------------------------------------------------------
type OfflineModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (session: OfflineSession) => void;
  colors: any;
};

type ModalStep = "form" | "qr" | "done";

function OfflinePaymentModal({
  visible,
  onClose,
  onSave,
  colors,
}: OfflineModalProps) {
  const [step, setStep] = useState<ModalStep>("form");
  const [taxRef, setTaxRef] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState(PAYMENT_TYPES[0]);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [session, setSession] = useState<OfflineSession | null>(null);
  const [amountWarning, setAmountWarning] = useState<"soft" | "hard" | null>(
    null,
  );

  const progressAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setStep("form");
        setTaxRef("");
        setAmount("");
        setPaymentType(PAYMENT_TYPES[0]);
        setSession(null);
        setAmountWarning(null);
      }, 300);
    }
  }, [visible]);

  useEffect(() => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setAmountWarning(null);
    } else if (parsed >= OFFLINE_HARD_CEILING) {
      setAmountWarning("hard");
    } else if (parsed >= OFFLINE_SOFT_WARNING) {
      setAmountWarning("soft");
    } else {
      setAmountWarning(null);
    }
  }, [amount]);

  useEffect(() => {
    const toValue = step === "form" ? 0.33 : step === "qr" ? 0.66 : 1;
    RNAnimated.timing(progressAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const handleGenerate = () => {
    if (!taxRef.trim()) {
      Alert.alert("Missing field", "Please enter your tax reference number.");
      return;
    }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert("Missing field", "Please enter a valid payment amount.");
      return;
    }
    if (parsed >= OFFLINE_HARD_CEILING) {
      Alert.alert(
        "Amount exceeds offline limit",
        `Offline payments are capped at RM ${OFFLINE_HARD_CEILING.toLocaleString()}. Please use the online payment portal for large transactions.`,
        [{ text: "OK" }],
      );
      return;
    }
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const newSession: OfflineSession = {
      token: generateToken(),
      ref: taxRef.trim(),
      amount: parsed.toFixed(2),
      paymentType,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: "pending",
    };
    setSession(newSession);
    setStep("qr");
  };

  const handleConfirm = () => {
    if (session) {
      onSave(session);
      setStep("done");
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={modalStyles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[modalStyles.sheet, { backgroundColor: colors.background }]}>
        {/* Handle */}
        <View style={modalStyles.handle} />

        {/* Progress bar */}
        <View style={modalStyles.progressTrack}>
          <RNAnimated.View
            style={[
              modalStyles.progressFill,
              {
                width: progressWidth,
                backgroundColor: step === "done" ? "#2E7D32" : colors.primary,
              },
            ]}
          />
        </View>

        {/* ── STEP 1: Form ── */}
        {step === "form" && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={modalStyles.stepHeader}>
              <View
                style={[
                  modalStyles.offlinePill,
                  { backgroundColor: "#FFF3E0" },
                ]}
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
                size={18}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(4),
                }}
              >
                Offline Tax Payment
              </AppText>
              <AppText
                size={12}
                style={{ color: colors.textSecondary, lineHeight: 18 }}
              >
                Your payment details are saved locally and will sync
                automatically when you reconnect.
              </AppText>
            </View>

            <View style={modalStyles.formBody}>
              <AppText
                size={12}
                style={[modalStyles.label, { color: colors.textSecondary }]}
              >
                Tax reference no. (No. Cukai Pendapatan)
              </AppText>
              <TextInput
                style={[
                  modalStyles.input,
                  {
                    backgroundColor: colors.backgroundGrouped,
                    color: colors.textPrimary,
                    borderColor: colors.border || "#E0E0E0",
                  },
                ]}
                placeholder="e.g. SG 1234567890"
                placeholderTextColor={colors.textSecondary}
                value={taxRef}
                onChangeText={setTaxRef}
                autoCapitalize="characters"
              />

              <AppText
                size={12}
                style={[modalStyles.label, { color: colors.textSecondary }]}
              >
                Payment amount (RM)
              </AppText>
              <TextInput
                style={[
                  modalStyles.input,
                  {
                    backgroundColor: colors.backgroundGrouped,
                    color: colors.textPrimary,
                    borderColor:
                      amountWarning === "hard"
                        ? "#F44336"
                        : amountWarning === "soft"
                          ? "#FF9800"
                          : colors.border || "#E0E0E0",
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />

              {/* Soft warning — RM 5,000 to RM 9,999 */}
              {amountWarning === "soft" && (
                <View
                  style={[
                    modalStyles.warningBanner,
                    { backgroundColor: "#FFF8E1", borderColor: "#FFE082" },
                  ]}
                >
                  <Ionicons name="warning-outline" size={14} color="#F57F17" />
                  <View style={{ flex: 1 }}>
                    <AppText
                      size={11}
                      style={{
                        color: "#F57F17",
                        fontWeight: "700",
                        marginBottom: vs(2),
                      }}
                    >
                      Large payment — proceed with caution
                    </AppText>
                    <AppText
                      size={11}
                      style={{ color: "#F57F17", lineHeight: 16 }}
                    >
                      Amounts above RM {OFFLINE_SOFT_WARNING.toLocaleString()}{" "}
                      may fail if funds are insufficient when syncing. Max
                      offline limit: RM {OFFLINE_HARD_CEILING.toLocaleString()}.
                    </AppText>
                  </View>
                </View>
              )}

              {/* Hard block — RM 10,000 and above */}
              {amountWarning === "hard" && (
                <View
                  style={[
                    modalStyles.warningBanner,
                    { backgroundColor: "#FFEBEE", borderColor: "#EF9A9A" },
                  ]}
                >
                  <Ionicons name="ban-outline" size={14} color="#C62828" />
                  <View style={{ flex: 1 }}>
                    <AppText
                      size={11}
                      style={{
                        color: "#C62828",
                        fontWeight: "700",
                        marginBottom: vs(2),
                      }}
                    >
                      Exceeds offline payment limit
                    </AppText>
                    <AppText
                      size={11}
                      style={{ color: "#C62828", lineHeight: 16 }}
                    >
                      Offline payments are capped at RM{" "}
                      {OFFLINE_HARD_CEILING.toLocaleString()} per Bank Negara
                      guidelines. Please use the online portal for this amount.
                    </AppText>
                  </View>
                </View>
              )}

              <AppText
                size={12}
                style={[modalStyles.label, { color: colors.textSecondary }]}
              >
                Payment type
              </AppText>
              <TouchableOpacity
                style={[
                  modalStyles.picker,
                  {
                    backgroundColor: colors.backgroundGrouped,
                    borderColor: colors.border || "#E0E0E0",
                  },
                ]}
                onPress={() => setTypePickerOpen(!typePickerOpen)}
              >
                <AppText
                  size={13}
                  style={{ color: colors.textPrimary, flex: 1 }}
                >
                  {paymentType}
                </AppText>
                <Ionicons
                  name={typePickerOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {typePickerOpen && (
                <View
                  style={[
                    modalStyles.pickerDropdown,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border || "#E0E0E0",
                    },
                  ]}
                >
                  {PAYMENT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        modalStyles.pickerOption,
                        type === paymentType && {
                          backgroundColor: colors.backgroundGrouped,
                        },
                      ]}
                      onPress={() => {
                        setPaymentType(type);
                        setTypePickerOpen(false);
                      }}
                    >
                      <AppText size={13} style={{ color: colors.textPrimary }}>
                        {type}
                      </AppText>
                      {type === paymentType && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={modalStyles.footer}>
              <TouchableOpacity
                style={[
                  modalStyles.footerBtn,
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
                  modalStyles.footerBtn,
                  modalStyles.footerBtnPrimary,
                  {
                    backgroundColor:
                      amountWarning === "hard" ? "#BDBDBD" : "#BA7517",
                  },
                ]}
                onPress={handleGenerate}
                disabled={amountWarning === "hard"}
              >
                <Ionicons name="qr-code-outline" size={15} color="#fff" />
                <AppText size={14} style={{ color: "#fff", fontWeight: "600" }}>
                  Generate QR token
                </AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ── STEP 2: QR Code ── */}
        {step === "qr" && session && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={modalStyles.stepHeader}>
              <AppText
                size={18}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(4),
                }}
              >
                One-time Payment Token
              </AppText>
              <AppText
                size={12}
                style={{ color: colors.textSecondary, lineHeight: 18 }}
              >
                Show this QR at the LHDN counter, or save the session — it will
                auto-transmit when you're back online.
              </AppText>
            </View>

            <View style={modalStyles.qrContainer}>
              <View
                style={[
                  modalStyles.qrFrame,
                  { borderColor: colors.border || "#E0E0E0" },
                ]}
              >
                <QRCode
                  value={JSON.stringify({
                    token: session.token,
                    ref: session.ref,
                    amount: session.amount,
                    type: session.paymentType,
                    expires: session.expiresAt,
                  })}
                  size={160}
                  backgroundColor="transparent"
                  color={colors.textPrimary}
                />
              </View>

              <View
                style={[
                  modalStyles.tokenBox,
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

              <View style={modalStyles.infoPills}>
                {[
                  { label: session.ref },
                  { label: `RM ${session.amount}` },
                  { label: session.paymentType.split(" ")[0] },
                  { label: "Expires 24h", warn: true },
                ].map((p, i) => (
                  <View
                    key={i}
                    style={[
                      modalStyles.infoPill,
                      {
                        backgroundColor: p.warn
                          ? "#FFF3E0"
                          : colors.backgroundGrouped,
                        borderColor: p.warn
                          ? "#FFCC80"
                          : colors.border || "#E0E0E0",
                      },
                    ]}
                  >
                    <AppText
                      size={11}
                      style={{
                        color: p.warn ? "#E65100" : colors.textSecondary,
                        fontWeight: "500",
                      }}
                    >
                      {p.label}
                    </AppText>
                  </View>
                ))}
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

            <View style={modalStyles.footer}>
              <TouchableOpacity
                style={[
                  modalStyles.footerBtn,
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
                  modalStyles.footerBtn,
                  modalStyles.footerBtnPrimary,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleConfirm}
              >
                <Ionicons name="save-outline" size={15} color="#fff" />
                <AppText size={14} style={{ color: "#fff", fontWeight: "600" }}>
                  Confirm & save session
                </AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* ── STEP 3: Done ── */}
        {step === "done" && session && (
          <View style={modalStyles.doneContainer}>
            <View
              style={[modalStyles.doneIcon, { backgroundColor: "#D4F1D4" }]}
            >
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
                marginBottom: vs(6),
              }}
            >
              Token{" "}
              <AppText
                size={13}
                style={{ fontWeight: "700", color: colors.textPrimary }}
              >
                {session.token}
              </AppText>{" "}
              is queued for{" "}
              <AppText
                size={13}
                style={{ fontWeight: "700", color: colors.textPrimary }}
              >
                RM {session.amount}
              </AppText>
              .
            </AppText>
            <AppText
              size={12}
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              It will transmit automatically when you reconnect to the internet.
            </AppText>
            <TouchableOpacity
              style={[modalStyles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <AppText size={14} style={{ color: "#fff", fontWeight: "600" }}>
                Done
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
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
    marginBottom: vs(16),
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  stepHeader: {
    paddingHorizontal: s(16),
    marginBottom: vs(16),
    gap: vs(6),
  },
  offlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: 10,
    marginBottom: vs(4),
  },
  formBody: {
    paddingHorizontal: s(16),
    gap: vs(4),
  },
  label: {
    fontWeight: "500",
    marginBottom: vs(4),
    marginTop: vs(10),
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    fontSize: 14,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: s(12),
    paddingVertical: vs(11),
    flexDirection: "row",
    alignItems: "center",
  },
  pickerDropdown: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: vs(4),
    overflow: "hidden",
  },
  pickerOption: {
    paddingHorizontal: s(12),
    paddingVertical: vs(11),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: s(8),
    padding: s(10),
    borderRadius: 8,
    borderWidth: 1,
    marginTop: vs(6),
  },
  qrContainer: {
    alignItems: "center",
    paddingHorizontal: s(16),
    gap: vs(16),
  },
  qrFrame: {
    padding: s(16),
    borderWidth: 1,
    borderRadius: 12,
  },
  tokenBox: {
    alignItems: "center",
    paddingHorizontal: s(20),
    paddingVertical: vs(10),
    borderRadius: 8,
    width: "100%",
  },
  infoPills: {
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
  footer: {
    flexDirection: "row",
    gap: s(10),
    paddingHorizontal: s(16),
    marginTop: vs(20),
  },
  footerBtn: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: s(6),
  },
  footerBtnPrimary: {
    borderWidth: 0,
  },
  doneContainer: {
    alignItems: "center",
    paddingHorizontal: s(24),
    paddingTop: vs(8),
    paddingBottom: vs(16),
  },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: vs(16),
  },
  doneBtn: {
    marginTop: vs(24),
    paddingVertical: vs(13),
    paddingHorizontal: s(48),
    borderRadius: 8,
  },
});

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function PayTaxPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();
  const { t } = useTranslation();

  // Network & offline state
  const [isOnline, setIsOnline] = useState(true);
  const [offlineSessions, setOfflineSessions] = useState<OfflineSession[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineModalVisible, setOfflineModalVisible] = useState(false);
  const [showPending, setShowPending] = useState(false);

  // Demo simulator — overrides real NetInfo for presentation purposes
  const [simMode, setSimMode] = useState(false); // false = real network, true = simulated
  const [simOnline, setSimOnline] = useState(false);
  const simToggleAnim = useRef(new RNAnimated.Value(0)).current;

  const effectiveOnline = simMode ? simOnline : isOnline;

  const toggleSimNetwork = () => {
    const next = !simOnline;
    setSimOnline(next);
    RNAnimated.timing(simToggleAnim, {
      toValue: next ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
    if (next) {
      syncPendingSessions();
    }
  };

  // Animations
  const titleAnim = useFadeInUp(stagger(0, 100));
  const descAnim = useFadeInUp(stagger(1, 100));
  const linkAnim = useFadeInUp(stagger(2, 100));
  const userGuideAnim = useFadeInUp(stagger(3, 100));
  const deptAnim = useFadeInUp(stagger(4, 100));
  const docsAnim = useFadeInUp(stagger(5, 100));
  const scanAnim = useFadeInUp(stagger(6, 100));
  const pendingAnim = useFadeInUp(stagger(7, 100));

  // Load stored sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Listen to real network changes (only applies when not in sim mode)
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);
      if (connected && !simMode) {
        syncPendingSessions();
      }
    });
    return unsub;
  }, [simMode]);

  const loadSessions = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: OfflineSession[] = JSON.parse(raw);
        // Mark expired sessions
        const now = new Date();
        const updated = parsed.map((s) =>
          s.status === "pending" && new Date(s.expiresAt) < now
            ? { ...s, status: "expired" as const }
            : s,
        );
        setOfflineSessions(updated);
        if (updated.some((s) => s.status === "pending")) setShowPending(true);
      }
    } catch (e) {
      console.error("Failed to load offline sessions:", e);
    }
  };

  const saveSession = async (session: OfflineSession) => {
    try {
      const updated = [...offlineSessions, session];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setOfflineSessions(updated);
      setShowPending(true);
    } catch (e) {
      console.error("Failed to save offline session:", e);
    }
  };

  const syncPendingSessions = async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const sessions: OfflineSession[] = JSON.parse(raw);
    const hasPending = sessions.some((s) => s.status === "pending");
    if (!hasPending) return;

    setIsSyncing(true);
    try {
      // ── REPLACE THIS with your actual API call ──
      // e.g. const result = await api.post('/tax-payments/sync', { sessions });
      // The API should return per-session outcomes: { token, status, failReason? }
      await new Promise((resolve) => setTimeout(resolve, 2000)); // simulate network

      const synced = sessions.map((s) => {
        if (s.status !== "pending") return s;

        // ── DEMO simulation: amounts above RM 8,000 fail with insufficient balance ──
        // In production, replace this block with actual API response per session
        const amt = parseFloat(s.amount);
        if (amt >= 8000) {
          return {
            ...s,
            status: "failed_balance" as const,
            failReason: "Insufficient account balance at time of sync",
          };
        }

        return { ...s, status: "synced" as const };
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
      setOfflineSessions(synced);

      // Show a summary alert if any failed
      const failedBalance = synced.filter((s) => s.status === "failed_balance");
      const failed = synced.filter((s) => s.status === "failed");
      if (failedBalance.length > 0 || failed.length > 0) {
        const total = failedBalance.length + failed.length;
        Alert.alert(
          "Some payments could not be processed",
          `${total} session(s) failed during sync. ${failedBalance.length > 0 ? "Please ensure sufficient balance and retry via the online portal." : ""}`,
          [{ text: "OK" }],
        );
      }
    } catch (e) {
      console.error("Sync failed:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      console.log("Unable to open URL");
    });
  };

  const pendingCount = offlineSessions.filter(
    (s) => s.status === "pending",
  ).length;

  const simThumbPos = simToggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });
  const simTrackColor = simToggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFCC80", "#A5D6A7"],
  });

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
          {t("payTax")}
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
                {/* Sim mode enable toggle */}
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

                {/* Online/Offline toggle — only shown in sim mode */}
                {simMode && (
                  <TouchableOpacity
                    style={styles.simToggleTrackWrap}
                    onPress={toggleSimNetwork}
                    activeOpacity={0.8}
                  >
                    <RNAnimated.View
                      style={[
                        styles.simToggleTrack,
                        { backgroundColor: simTrackColor },
                      ]}
                    >
                      <RNAnimated.View
                        style={[styles.simToggleThumb, { left: simThumbPos }]}
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

          {/* Network status + sync indicator */}
          <Animated.View style={[{ marginBottom: vs(12) }, titleAnim]}>
            <View style={styles.networkRow}>
              <NetworkBadge isOnline={effectiveOnline} />
              {isSyncing && (
                <View style={styles.syncRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <AppText size={11} style={{ color: colors.textSecondary }}>
                    Syncing sessions...
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

          {/* Title Section */}
          <Animated.View style={[styles.titleSection, titleAnim]}>
            <AppText
              size={18}
              style={{
                fontWeight: "700",
                marginBottom: vs(4),
                color: colors.textPrimary,
              }}
            >
              Online Queue & Appointments
            </AppText>
          </Animated.View>

          {/* Pay Tax Card */}
          <Animated.View style={descAnim}>
            <View
              style={[
                styles.sectionCard,
                { backgroundColor: colors.backgroundGrouped },
              ]}
            >
              <AppText
                size={16}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(4),
                }}
              >
                Pay Tax Online
              </AppText>
              <AppText
                size={12}
                style={{
                  color: colors.primary,
                  fontWeight: "600",
                  marginBottom: vs(8),
                }}
              >
                LHDN (Tax Services)
              </AppText>
              <AppText
                size={12}
                style={{
                  color: colors.textSecondary,
                  lineHeight: 18,
                  marginBottom: vs(12),
                }}
              >
                Make income tax payments or settle outstanding balances online
              </AppText>
            </View>
          </Animated.View>

          {/* Payment Buttons */}
          <Animated.View style={linkAnim}>
            <View style={{ marginBottom: vs(16) }}>
              <AppText
                size={12}
                style={{
                  color: colors.textSecondary,
                  fontWeight: "500",
                  marginBottom: vs(6),
                }}
              >
                Redirect to current LHDN online payment platform
              </AppText>
              <TextInput
                editable={false}
                style={[
                  styles.urlInput,
                  {
                    backgroundColor: colors.backgroundGrouped,
                    color: colors.textPrimary,
                    borderColor: colors.border || "#E0E0E0",
                  },
                ]}
                value={REDIRECT_URL}
              />

              {/* Online payment button */}
              <TouchableOpacity
                style={[
                  styles.openButton,
                  {
                    backgroundColor: effectiveOnline
                      ? colors.primary
                      : "#C7C7CC",
                  },
                ]}
                onPress={() => effectiveOnline && handleOpenLink(REDIRECT_URL)}
                disabled={!effectiveOnline}
              >
                <Ionicons name="globe-outline" size={15} color="#fff" />
                <AppText
                  size={12}
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  Open Payment Portal
                </AppText>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: colors.border || "#E0E0E0" },
                  ]}
                />
                <AppText
                  size={11}
                  style={{
                    color: colors.textSecondary,
                    marginHorizontal: s(8),
                  }}
                >
                  or
                </AppText>
                <View
                  style={[
                    styles.dividerLine,
                    { backgroundColor: colors.border || "#E0E0E0" },
                  ]}
                />
              </View>

              {/* ── OFFLINE PAYMENT BUTTON (new feature) ── */}
              <TouchableOpacity
                style={[styles.offlineButton, { borderColor: "#BA7517" }]}
                onPress={() => setOfflineModalVisible(true)}
              >
                <View
                  style={[
                    styles.offlineIconBox,
                    { backgroundColor: "#FFF3E0" },
                  ]}
                >
                  <Ionicons name="wifi-outline" size={16} color="#BA7517" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText
                    size={13}
                    style={{
                      fontWeight: "700",
                      color: "#854F0B",
                      marginBottom: vs(1),
                    }}
                  >
                    Pay Offline
                  </AppText>
                  <AppText
                    size={11}
                    style={{ color: "#BA7517", lineHeight: 15 }}
                  >
                    Generate a one-time QR token · syncs when back online
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#BA7517" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Pending offline sessions */}
          {showPending && offlineSessions.length > 0 && (
            <Animated.View style={[pendingAnim, { marginBottom: vs(16) }]}>
              <TouchableOpacity
                style={styles.pendingHeader}
                onPress={() => setShowPending(!showPending)}
              >
                <AppText
                  size={14}
                  style={{ fontWeight: "700", color: colors.textPrimary }}
                >
                  Offline Sessions ({offlineSessions.length})
                </AppText>
                <Ionicons
                  name={showPending ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              {offlineSessions.map((s) => (
                <SessionRow key={s.token} session={s} />
              ))}
            </Animated.View>
          )}

          {/* User Guide with Video */}
          <Animated.View style={userGuideAnim}>
            <View style={{ marginBottom: vs(16) }}>
              <AppText
                size={14}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(10),
                }}
              >
                User Guide
              </AppText>
              <YoutubePlayer
                videoId="uMYmyRX7xRU"
                height={220}
                onReady={() => console.log("YouTube video ready")}
                onError={(e: any) => console.log("YouTube error:", e)}
                webViewProps={{
                  javaScriptEnabled: true,
                  originWhitelist: ["*", "https://*", "http://*"],
                  mixedContentMode: "always",
                  allowsFullscreenVideo: true,
                  onShouldStartLoadWithRequest: (request: any) => true,
                }}
              />
            </View>
          </Animated.View>

          {/* Nearest Relevant Department */}
          <Animated.View style={deptAnim}>
            <View style={{ marginBottom: vs(16) }}>
              <AppText
                size={14}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(10),
                }}
              >
                Nearest Relevant Department
              </AppText>

              {[
                { name: "LHDN Putih", waiting: 5, open: true },
                { name: "LHDN Putchong", waiting: 3, open: true },
                { name: "LHDN Cyberjays", waiting: 0, open: false },
              ].map((dept) => (
                <View
                  key={dept.name}
                  style={[
                    styles.departmentItem,
                    {
                      backgroundColor: dept.open ? "#FFF8E1" : "#FFE0B2",
                      borderColor: dept.open ? "#FFE082" : "#FFCC80",
                      marginTop: vs(8),
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <AppText
                      size={12}
                      style={{
                        color: colors.textPrimary,
                        fontWeight: "600",
                        marginBottom: vs(4),
                      }}
                    >
                      {dept.name}
                    </AppText>
                    <AppText size={11} style={{ color: colors.textSecondary }}>
                      {dept.waiting} waiting
                    </AppText>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.queueButton,
                      { backgroundColor: dept.open ? "#D4F1D4" : "#FFCDD2" },
                    ]}
                  >
                    <AppText
                      size={11}
                      style={{
                        color: dept.open ? "#2E7D32" : "#C62828",
                        fontWeight: "600",
                      }}
                    >
                      {dept.open ? "Join Queue" : "Closed"}
                    </AppText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Required Documents */}
          <Animated.View style={docsAnim}>
            <View style={{ marginBottom: vs(16) }}>
              <AppText
                size={14}
                style={{
                  fontWeight: "700",
                  color: colors.textPrimary,
                  marginBottom: vs(10),
                }}
              >
                Required Documents
              </AppText>
              <View
                style={[
                  styles.docCard,
                  { backgroundColor: "#FFCCCC", borderColor: "#FF9999" },
                ]}
              >
                <AppText
                  size={12}
                  style={{
                    color: colors.textPrimary,
                    fontWeight: "600",
                    marginBottom: vs(6),
                  }}
                >
                  IC / MyKad
                </AppText>
                <AppText
                  size={11}
                  style={{ color: colors.textSecondary, marginBottom: vs(6) }}
                >
                  Tax Reference Number
                </AppText>
                <AppText size={11} style={{ color: colors.textSecondary }}>
                  Income details (if needed)
                </AppText>
              </View>
            </View>
          </Animated.View>

          {/* Scan Document Button */}
          <Animated.View style={scanAnim}>
            <TouchableOpacity
              style={[
                styles.scanButton,
                {
                  backgroundColor: colors.backgroundGrouped,
                  borderColor: colors.primary,
                },
              ]}
            >
              <AppText
                size={12}
                style={{
                  color: colors.primary,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                Scan document to auto-fill your details
              </AppText>
            </TouchableOpacity>
          </Animated.View>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Offline Payment Modal */}
      <OfflinePaymentModal
        visible={offlineModalVisible}
        onClose={() => setOfflineModalVisible(false)}
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
  titleSection: {
    marginBottom: vs(12),
  },
  sectionCard: {
    borderRadius: 8,
    padding: s(12),
    marginBottom: vs(12),
  },
  urlInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: s(10),
    fontSize: 11,
    marginBottom: vs(8),
  },
  openButton: {
    paddingVertical: vs(11),
    borderRadius: 6,
    marginBottom: vs(8),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(6),
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: vs(10),
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  // ── New offline button style ──
  offlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(12),
    paddingVertical: vs(12),
    paddingHorizontal: s(14),
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: "#FFFBF5",
    marginBottom: vs(8),
  },
  offlineIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  networkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(10),
  },
  // ── Demo simulator bar ──
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
  simBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
  },
  simDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  simSmallBtn: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    borderRadius: 6,
    borderWidth: 1,
  },
  simToggleTrackWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  simToggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    position: "relative",
  },
  simToggleThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    top: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
  },
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
  departmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: s(12),
    borderRadius: 6,
    borderWidth: 1,
  },
  queueButton: {
    paddingVertical: vs(6),
    paddingHorizontal: s(10),
    borderRadius: 4,
  },
  docCard: {
    borderWidth: 1,
    borderRadius: 6,
    padding: s(12),
  },
  scanButton: {
    paddingVertical: vs(12),
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: vs(20),
  },
});
