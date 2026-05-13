import { AppText } from "@/components/common/AppText";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { CameraView, useCameraPermissions } from "@/components/platform/Camera";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { db } from "@/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type Status = "scanning" | "sending" | "sent" | "error";

function extractToken(raw: string): string | null {
  // QR payload from id-card.html is JSON: { v, type, token }
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object" && typeof obj.token === "string") {
      return obj.token;
    }
  } catch {
    // Fall through — accept a bare token string as well.
  }
  const trimmed = raw.trim();
  if (trimmed.length >= 8 && trimmed.length <= 128) return trimmed;
  return null;
}

export default function ScanQRPage() {
  const router = useRouter();
  const { colors, userProfile } = useAppContext();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<Status>("scanning");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const lockRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcode = async (result: { data?: string }) => {
    if (lockRef.current || !result?.data) return;
    const token = extractToken(result.data);
    if (!token) return;
    lockRef.current = true;
    setStatus("sending");
    setErrorMessage("");

    try {
      if (!userProfile) {
        throw new Error("Please sign in to share your profile.");
      }
      await setDoc(
        doc(db, "id_card_sessions", token),
        {
          name: userProfile.fullName || "",
          mykad: userProfile.icNumber || "",
          address: userProfile.address || "",
          filledAt: serverTimestamp(),
          status: "filled",
        },
        { merge: true },
      );
      setStatus("sent");
    } catch (e: any) {
      setStatus("error");
      setErrorMessage(e?.message || "Failed to send profile.");
    }
  };

  const handleRescan = () => {
    lockRef.current = false;
    setStatus("scanning");
    setErrorMessage("");
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppText size={14}>Loading camera…</AppText>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.permissionContainer}>
          <IconSymbol size={48} name="qrcode.viewfinder" color={colors.primary} />
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
            We need camera access to scan QR codes.
          </AppText>
          <View style={{ marginTop: vs(24), paddingHorizontal: s(16) }}>
            <PrimaryButton label="Grant Permission" onPress={() => requestPermission()} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { backgroundColor: colors.background }]}>
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
          Scan QR
        </AppText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cameraContainer}>
          {status === "scanning" ? (
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={handleBarcode as any}
            />
          ) : (
            <View style={[styles.camera, styles.statusOverlay]}>
              {status === "sending" && (
                <>
                  <ActivityIndicator size="large" color="#fff" />
                  <AppText
                    size={15}
                    style={{ color: "#fff", fontWeight: "600", marginTop: vs(12) }}
                  >
                    Sending your profile…
                  </AppText>
                </>
              )}
              {status === "sent" && (
                <>
                  <IconSymbol size={64} name="checkmark.circle.fill" color="#4CAF50" />
                  <AppText
                    size={16}
                    style={{ color: "#fff", fontWeight: "700", marginTop: vs(12) }}
                  >
                    ID Card Filled
                  </AppText>
                  <AppText
                    size={12}
                    style={{
                      color: "#cfd4dc",
                      marginTop: vs(6),
                      paddingHorizontal: s(24),
                      textAlign: "center",
                    }}
                  >
                    Check the browser page — your name, MyKad and address should now appear.
                  </AppText>
                </>
              )}
              {status === "error" && (
                <>
                  <IconSymbol size={56} name="exclamationmark.triangle.fill" color="#F44336" />
                  <AppText
                    size={15}
                    style={{ color: "#fff", fontWeight: "700", marginTop: vs(12) }}
                  >
                    Something went wrong
                  </AppText>
                  <AppText
                    size={12}
                    style={{
                      color: "#cfd4dc",
                      marginTop: vs(6),
                      paddingHorizontal: s(24),
                      textAlign: "center",
                    }}
                  >
                    {errorMessage}
                  </AppText>
                </>
              )}
            </View>
          )}

          {status === "scanning" && (
            <>
              <View style={styles.frameOverlay}>
                <View style={styles.frameBorder} />
              </View>
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
                  Align the QR code inside the frame
                </AppText>
              </View>
            </>
          )}
        </View>

        {status !== "scanning" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: colors.backgroundGrouped }]}
              onPress={handleRescan}
            >
              <IconSymbol size={18} name="arrow.counterclockwise" color={colors.primary} />
              <AppText
                size={14}
                style={{ fontWeight: "600", color: colors.primary, marginLeft: s(8) }}
              >
                Scan Again
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingVertical: vs(16),
  },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: vs(40) },
  cameraContainer: {
    marginHorizontal: s(16),
    marginTop: vs(8),
    height: 420,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  },
  camera: { width: "100%", height: "100%" },
  statusOverlay: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.9)",
    paddingHorizontal: s(16),
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
    width: 240,
    height: 240,
    borderWidth: 2.5,
    borderColor: "#4CAF50",
    borderRadius: 12,
  },
  instructionOverlay: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  actions: {
    paddingHorizontal: s(16),
    marginTop: vs(16),
  },
  secondaryButton: {
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
