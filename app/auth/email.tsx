import { FormInput } from "@/components/ui/FormInput";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { VersionFooter } from "@/components/ui/VersionFooter";
import { AppColors } from "@/constants/colors";
import { fs, s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import {
  stagger,
  useFadeIn,
  useFadeInUp,
  useScaleIn,
} from "@/hooks/useAnimations";
import { auth, db } from "@/services/firebase";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EmailScreen() {
  const router = useRouter();
  const { setUserProfile } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const stepAnim = useFadeIn(stagger(0, 100));
  const iconAnim = useScaleIn(stagger(1, 100));
  const inputAnim = useFadeInUp(stagger(2, 100));
  const passAnim = useFadeInUp(stagger(3, 100));
  const btnAnim = useFadeInUp(stagger(4, 100));

  const isValid = email.trim().length > 0 && password.length >= 6;

  const handleLogin = async () => {
    if (!isValid) return;
    setIsLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      const uid = userCred.user.uid;

      // Load profile from Firestore
      const profileDoc = await getDoc(doc(db, "users", uid));
      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setUserProfile({
          uid,
          email: data.email || email.trim(),
          fullName: data.fullName || "",
          icNumber: data.icNumber || "",
          address: data.address || "",
          mykadPhotoUrl: data.mykadPhotoUrl || "",
        });
      }

      router.replace("/home/Home");
    } catch (err: any) {
      console.error("[login] Error:", err);
      const msg =
        err?.code === "auth/invalid-credential"
          ? "Invalid email or password."
          : err?.code === "auth/user-not-found"
            ? "No account found with this email."
            : err?.message || "Login failed.";
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={AppColors.background}
      />

      <View style={styles.container}>
        <Animated.View style={[styles.iconWrapper, iconAnim]}>
          <Text style={styles.icon}>🔐</Text>
        </Animated.View>

        <Animated.View style={stepAnim}>
          <Text style={styles.title}>Log In</Text>
        </Animated.View>

        <Animated.View style={[{ width: "100%" }, inputAnim]}>
          <FormInput
            label="Email"
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </Animated.View>

        <Animated.View style={[{ width: "100%" }, passAnim]}>
          <FormInput
            label="Password"
            placeholder="Enter password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </Animated.View>

        <Animated.View style={[{ width: "100%" }, btnAnim]}>
          <PrimaryButton
            label={isLoading ? "Logging in..." : "Log In"}
            onPress={handleLogin}
            disabled={!isValid || isLoading}
          />
        </Animated.View>

        {isLoading && (
          <ActivityIndicator
            size="large"
            color={AppColors.primary}
            style={{ marginTop: vs(16) }}
          />
        )}
      </View>

      <VersionFooter />
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
    paddingTop: vs(60),
  },
  title: {
    fontSize: fs(22),
    fontWeight: "700",
    color: AppColors.textPrimary,
    marginBottom: vs(24),
    textAlign: "center",
  },
  iconWrapper: { marginBottom: vs(16) },
  icon: { fontSize: fs(64) },
});
