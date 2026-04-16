import { AppText } from "@/components/common/AppText";
import { FormInput } from "@/components/ui/FormInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { BackButton } from "@/components/ui/BackButton";
import { AppColors } from "@/constants/colors";
import { fs, s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { auth, db, storage } from "@/services/firebase";
import { sendChatMessage } from "@/services/chatService";
import { isValidEmail, getPasswordStrength, getFirebaseAuthErrorMessage } from "@/utils/validation";
import { stagger, useFadeIn, useFadeInUp, useScaleIn } from "@/hooks/useAnimations";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CreateDigitalIdScreen() {
  const router = useRouter();
  const { setUserProfile } = useAppContext();
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // Step 2 fields
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ocrResult, setOcrResult] = useState<{ fullName: string; icNumber: string; address: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Animations
  const stepAnim = useFadeIn(stagger(0, 100));
  const iconAnim = useScaleIn(stagger(1, 100));
  const input1Anim = useFadeInUp(stagger(2, 100));
  const input2Anim = useFadeInUp(stagger(3, 100));
  const input3Anim = useFadeInUp(stagger(4, 100));
  const btnAnim = useFadeInUp(stagger(5, 100));

  const isStep1Valid =
    isValidEmail(email) &&
    password.length >= 6 &&
    password === confirmPassword;

  const passwordStrength = getPasswordStrength(password);

  const validateEmail = () => {
    if (!email.trim()) setEmailError("Email is required.");
    else if (!isValidEmail(email)) setEmailError("Enter a valid email address.");
    else setEmailError("");
  };

  const validatePassword = () => {
    if (!password) setPasswordError("Password is required.");
    else if (password.length < 6) setPasswordError("Password must be at least 6 characters.");
    else setPasswordError("");
  };

  const validateConfirm = () => {
    if (confirmPassword && password !== confirmPassword) setConfirmError("Passwords don't match.");
    else setConfirmError("");
  };

  const handleNext = () => {
    validateEmail();
    validatePassword();
    validateConfirm();
    if (!isStep1Valid) return;
    setStep(2);
  };

  const readPhotoAsBase64 = async (uri: string): Promise<string> => {
    const res = await fetch(uri);
    const blob = await res.blob();
    const reader = new FileReader();
    return new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] || result);
      };
      reader.readAsDataURL(blob);
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
    if (!photo) return;

    setCapturedPhoto(photo.uri);
    setIsScanning(true);

    // Run OCR immediately after capture
    try {
      const base64Data = await readPhotoAsBase64(photo.uri);
      const result = await sendChatMessage(
        "Extract the full name, IC number, and address from this MyKAD image.",
        [],
        { mode: "ocr", documentType: "mykad", imageBase64: base64Data }
      );

      let fullName = result.formData?.fullName || "";
      let icNumber = result.formData?.icNumber || "";
      let address = result.formData?.address || "";

      // If formData didn't have the fields, try to parse from reply text
      if (!fullName && result.reply) {
        const jsonMatch = result.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            fullName = parsed.fullName || parsed.full_name || parsed.name || "";
            icNumber = icNumber || parsed.icNumber || parsed.ic_number || parsed.ic || "";
            address = address || parsed.address || "";
          } catch {
            // ignore parse errors
          }
        }
      }

      if (fullName) {
        setOcrResult({ fullName, icNumber, address });
      } else {
        console.warn("[create-digital-id] OCR response:", JSON.stringify(result));
        Alert.alert(
          "Scan Incomplete",
          "Could not extract your name from the MyKAD. Please retake with the card flat and well-lit.",
        );
      }
    } catch (ocrErr) {
      console.warn("[create-digital-id] OCR failed:", ocrErr);
      Alert.alert("OCR Error", "Failed to scan your MyKAD. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setOcrResult(null);
  };

  const handleCreateAccount = async () => {
    if (!capturedPhoto || !ocrResult) {
      Alert.alert("Error", "Please capture and scan your MyKAD first.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Firebase Auth user
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCred.user.uid;

      // 2. Upload MyKAD photo to Firebase Storage
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      const storageRef = ref(storage, `mykad/${uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const mykadPhotoUrl = await getDownloadURL(storageRef);

      // 3. Store profile in Firestore with OCR-extracted data
      const profile = {
        email: email.trim(),
        fullName: ocrResult.fullName,
        icNumber: ocrResult.icNumber,
        address: ocrResult.address,
        mykadPhotoUrl,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "users", uid), profile);

      // 4. Set in AppContext
      setUserProfile({ uid, ...profile });

      // 5. Navigate to home
      router.replace("/home/Home");
    } catch (err: any) {
      console.error("[create-digital-id] Error:", err);
      const msg = getFirebaseAuthErrorMessage(err?.code || "");
      if (err?.code === "auth/email-already-in-use" || err?.code === "auth/invalid-email") {
        setStep(1);
        setEmailError(msg);
      } else if (err?.code === "auth/weak-password") {
        setStep(1);
        setPasswordError(msg);
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 camera needs permission
  if (step === 2 && !permission?.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <BackButton onPress={() => setStep(1)} />
        <View style={styles.container}>
          <AppText size={16} style={{ textAlign: "center", marginBottom: vs(20) }}>
            Camera permission is required to capture your MyKAD.
          </AppText>
          <PrimaryButton label="Grant Permission" onPress={() => requestPermission()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={AppColors.background} />
      <BackButton onPress={step === 2 ? () => setStep(1) : undefined} />

      <View style={styles.container}>
        {step === 1 ? (
          <>
            <Animated.View style={stepAnim}>
              <AppText size={13} style={styles.step}>
                Step 1 of 2
              </AppText>
            </Animated.View>

            <Animated.View style={[styles.iconWrapper, iconAnim]}>
              <AppText size={64} style={{ textAlign: "center" }}>
                🪪
              </AppText>
            </Animated.View>

            <Animated.View style={[styles.titleRow, iconAnim]}>
              <AppText size={22} style={{ fontWeight: "700", textAlign: "center", marginBottom: vs(24) }}>
                Create Digital ID
              </AppText>
            </Animated.View>

            <Animated.View style={[{ width: "100%" }, input1Anim]}>
              <FormInput
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(""); }}
                onBlur={validateEmail}
                error={emailError}
              />
            </Animated.View>

            <Animated.View style={[{ width: "100%" }, input2Anim]}>
              <FormInput
                label="Password"
                placeholder="At least 6 characters"
                secureTextEntry
                value={password}
                onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(""); if (confirmError && t === confirmPassword) setConfirmError(""); }}
                onBlur={validatePassword}
                error={passwordError}
              />
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {(["weak", "good", "strong"] as const).map((level, i) => {
                    const active =
                      (passwordStrength === "weak" && i === 0) ||
                      (passwordStrength === "good" && i <= 1) ||
                      (passwordStrength === "strong" && i <= 2);
                    const color =
                      passwordStrength === "weak" ? "#FF3B30" :
                      passwordStrength === "good" ? "#FF9500" : "#34C759";
                    return (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          { backgroundColor: active ? color : AppColors.border },
                        ]}
                      />
                    );
                  })}
                  <AppText size={11} style={{ color: AppColors.textSecondary, marginLeft: s(8) }}>
                    {passwordStrength === "weak" ? "Weak" : passwordStrength === "good" ? "Good" : "Strong"}
                  </AppText>
                </View>
              )}
            </Animated.View>

            <Animated.View style={[{ width: "100%" }, input3Anim]}>
              <FormInput
                label="Confirm Password"
                placeholder="Re-enter password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); if (confirmError) setConfirmError(""); }}
                onBlur={validateConfirm}
                error={confirmError}
              />
            </Animated.View>

            <Animated.View style={[{ width: "100%" }, btnAnim]}>
              <PrimaryButton
                label="Next"
                onPress={handleNext}
                disabled={!isStep1Valid}
              />
            </Animated.View>
          </>
        ) : (
          <>
            <AppText size={13} style={styles.step}>
              Step 2 of 2
            </AppText>

            <AppText
              size={22}
              style={{
                fontWeight: "700",
                textAlign: "center",
                marginBottom: vs(8),
              }}
            >
              Scan Your MyKAD
            </AppText>
            <AppText
              size={14}
              style={{
                color: AppColors.textSecondary,
                textAlign: "center",
                marginBottom: vs(20),
              }}
            >
              Position the front of your MyKAD within the frame
            </AppText>

            <View style={styles.cameraContainer}>
              {capturedPhoto ? (
                <Image source={{ uri: capturedPhoto }} style={styles.preview} />
              ) : (
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="back"
                />
              )}
              {/* Frame overlay */}
              <View style={styles.frameOverlay}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
            </View>

            {/* OCR scanning indicator */}
            {isScanning && (
              <View style={styles.scanningRow}>
                <ActivityIndicator size="small" color={AppColors.primary} />
                <AppText size={14} style={{ color: AppColors.textSecondary, marginLeft: s(8) }}>
                  Scanning MyKAD...
                </AppText>
              </View>
            )}

            {/* Show extracted info */}
            {ocrResult && !isScanning && (
              <View style={styles.ocrResultCard}>
                <AppText size={12} style={{ color: AppColors.textSecondary, marginBottom: vs(4) }}>
                  Extracted from MyKAD:
                </AppText>
                <AppText size={16} style={{ fontWeight: "700", color: AppColors.textPrimary }}>
                  {ocrResult.fullName}
                </AppText>
                {ocrResult.icNumber ? (
                  <AppText size={14} style={{ color: AppColors.textSecondary, marginTop: vs(2) }}>
                    IC: {ocrResult.icNumber}
                  </AppText>
                ) : null}
              </View>
            )}

            <View style={styles.step2Buttons}>
              {capturedPhoto ? (
                <>
                  <TouchableOpacity
                    style={styles.retakeBtn}
                    onPress={handleRetake}
                    activeOpacity={0.7}
                  >
                    <AppText
                      size={15}
                      style={{ fontWeight: "600", color: AppColors.primary }}
                    >
                      Retake
                    </AppText>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      label={isSubmitting ? "Creating..." : "Create Account"}
                      onPress={handleCreateAccount}
                      disabled={isSubmitting || isScanning || !ocrResult}
                    />
                  </View>
                </>
              ) : (
                <View style={{ width: "100%" }}>
                  <PrimaryButton label="Capture" onPress={handleCapture} />
                </View>
              )}
            </View>

            {isSubmitting && (
              <ActivityIndicator
                size="large"
                color={AppColors.primary}
                style={{ marginTop: vs(16) }}
              />
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: s(32),
  },
  step: {
    fontSize: fs(13),
    color: AppColors.textSecondary,
    marginBottom: vs(20),
    textAlign: "center",
  },
  iconWrapper: { marginBottom: vs(12) },
  titleRow: { width: "100%" },
  cameraContainer: {
    width: "100%",
    aspectRatio: 1.586, // ID card ratio
    borderRadius: s(12),
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: vs(20),
  },
  camera: {
    flex: 1,
  },
  preview: {
    flex: 1,
    resizeMode: "cover",
  },
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#FFF",
  },
  cornerTL: {
    top: 16,
    left: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 16,
    right: 16,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  step2Buttons: {
    flexDirection: "row",
    width: "100%",
    gap: s(12),
    alignItems: "center",
  },
  retakeBtn: {
    paddingVertical: vs(15),
    paddingHorizontal: s(20),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: AppColors.primary,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: vs(-12),
    marginBottom: vs(12),
    gap: s(4),
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    maxWidth: s(60),
  },
  scanningRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(16),
  },
  ocrResultCard: {
    width: "100%",
    backgroundColor: "#E8F5E9",
    borderRadius: s(10),
    padding: s(14),
    marginBottom: vs(16),
  },
});
