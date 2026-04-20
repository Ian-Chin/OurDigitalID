import { AppText } from "@/components/common/AppText";
import { useAppContext } from "@/context/AppContext";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

type LocationAccessGateProps = {
  children: React.ReactNode;
};

export function LocationAccessGate({ children }: LocationAccessGateProps) {
  const { colors } = useAppContext();
  const [checking, setChecking] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [servicesEnabled, setServicesEnabled] = useState(false);
  const [canAskAgain, setCanAskAgain] = useState(true);

  const checkAccess = async (shouldRequestPermission: boolean) => {
    setChecking(true);

    try {
      const locationServicesEnabled = await Location.hasServicesEnabledAsync();
      setServicesEnabled(locationServicesEnabled);

      let permissionResponse = await Location.getForegroundPermissionsAsync();
      if (!permissionResponse.granted && shouldRequestPermission) {
        permissionResponse = await Location.requestForegroundPermissionsAsync();
      }

      setPermissionGranted(permissionResponse.granted);
      setCanAskAgain(permissionResponse.canAskAgain);
    } catch (error) {
      console.error("Error checking location access:", error);
      setPermissionGranted(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkAccess(true);
  }, []);

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error("Error opening settings:", error);
    }
  };

  if (checking) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (permissionGranted && servicesEnabled) {
    return <>{children}</>;
  }

  const message = !permissionGranted
    ? canAskAgain
      ? "Location permission is required to continue."
      : "Location permission is blocked. Enable it in Settings to continue."
    : "Location services are off. Turn on device location to continue.";

  return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <View
        style={[styles.card, { backgroundColor: colors.backgroundGrouped }]}
      >
        <AppText
          size={18}
          style={{ fontWeight: "700", marginBottom: 8, textAlign: "center" }}
        >
          Location Required
        </AppText>
        <AppText
          size={13}
          style={{
            color: colors.textSecondary,
            textAlign: "center",
            marginBottom: 14,
          }}
        >
          {message}
        </AppText>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => checkAccess(true)}
        >
          <AppText size={13} style={styles.primaryButtonText}>
            Allow location
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { borderColor: colors.primary, backgroundColor: "transparent" },
          ]}
          onPress={handleOpenSettings}
        >
          <AppText
            size={13}
            style={{ color: colors.primary, fontWeight: "600" }}
          >
            Open settings
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    padding: 16,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    alignItems: "center",
  },
});
