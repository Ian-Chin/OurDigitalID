import { AppText } from "@/components/common/AppText";
import { NotificationButton } from "@/components/NotificationButton/Notification-button";
import { useAppContext } from "@/context/AppContext";
import { db } from "@/services/firebase";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { getDistance } from "geolib";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FloodStation {
  id: string;
  station_name: string;
  district: string;
  state: string;
  status: string;
  latitude: number;
  longitude: number;
}

interface UserCoords {
  latitude: number;
  longitude: number;
}

const DEFAULT_REGION: Region = {
  latitude: 4.2105,
  longitude: 101.9758,
  latitudeDelta: 7,
  longitudeDelta: 7,
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const startLatitude = toRadians(first.latitude);
  const endLatitude = toRadians(second.latitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2) *
      Math.cos(startLatitude) *
      Math.cos(endLatitude);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const sendLocalNotification = async (stationName: string, distance: number) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Flood Alert Near You!",
      body: `${stationName} is at DANGER level and only ${distance.toFixed(1)}km away. Move to higher ground.`,
      data: { data: "goes here" },
    },
    trigger: null,
  });
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Keep legacy flag for broader Expo/RN compatibility.
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function requestNotificationPermission() {
  const settings = await Notifications.getPermissionsAsync();
  if (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const request = await Notifications.requestPermissionsAsync();
  return (
    request.granted ||
    request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function configureAndroidNotificationChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "Flood Alerts",
    description: "High-priority flood proximity alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#D32F2F",
    sound: "default",
  });
}

const checkFloodProximity = async (
  userCoords: UserCoords,
  stations: FloodStation[],
  onFloodAlert: (stationName: string, distanceInKm: number) => void,
) => {
  for (const station of stations) {
    // Only care about stations in "DANGER" status
    if (station.status === "DANGER") {
      const distance = getDistance(
        { latitude: userCoords.latitude, longitude: userCoords.longitude },
        { latitude: station.latitude, longitude: station.longitude },
      );

      const distanceInKm = distance / 1000;

      if (distanceInKm <= 5) {
        onFloodAlert(station.station_name, distanceInKm);
        try {
          await sendLocalNotification(station.station_name, distanceInKm);
        } catch (notificationError) {
          console.error(
            "Failed to schedule local notification:",
            notificationError,
          );
        }
      }
    }
  }
};

export default function GISMap() {
  const insets = useSafeAreaInsets();
  const { colors, addNotification } = useAppContext();
  const [stations, setStations] = useState<FloodStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<FloodStation | null>(
    null,
  );

  useEffect(() => {
    const loadStations = async () => {
      try {
        const snapshot = await getDocs(collection(db, "flood_stations"));
        const loadedStations: FloodStation[] = snapshot.docs
          .map((document) => {
            const data = document.data();
            const location = data.location;

            if (
              !location ||
              typeof location.latitude !== "number" ||
              typeof location.longitude !== "number"
            ) {
              return null;
            }

            return {
              id: document.id,
              station_name: data.station_name ?? document.id,
              district: data.district ?? "",
              state: data.state ?? "",
              status: data.status ?? "UNKNOWN",
              latitude: location.latitude,
              longitude: location.longitude,
            };
          })
          .filter((station): station is FloodStation => station !== null);

        setStations(loadedStations);
        setSelectedStation(loadedStations[0] ?? null);

        await configureAndroidNotificationChannel();
        const notificationPermissionGranted =
          await requestNotificationPermission();
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted" && notificationPermissionGranted) {
          const position = await Location.getCurrentPositionAsync({});
          await checkFloodProximity(
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            loadedStations,
            (stationName, distanceInKm) => {
              addNotification({
                type: "alert",
                message: `${stationName} is at DANGER level and ${distanceInKm.toFixed(1)}km away. Move to higher ground.`,
              });
            },
          );
        }
      } catch (error) {
        console.error("Error loading flood stations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, [addNotification]);

  const nearbyStations = useMemo(() => {
    if (!selectedStation) {
      return [];
    }

    return stations.filter(
      (station) => distanceKm(selectedStation, station) <= 120,
    );
  }, [selectedStation, stations]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 4, backgroundColor: colors.background },
        ]}
      >
        <Image
          source={require("../../assets/images/ourdigitalID.png")}
          style={styles.logo}
        />
        <View style={styles.headerSpacer} />
        <NotificationButton />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.titleSection}>
            <AppText
              size={22}
              style={{ fontWeight: "700", color: colors.textPrimary }}
            >
              GIS
            </AppText>
            <AppText size={13} style={{ color: colors.textSecondary }}>
              Flood station overview
            </AppText>
          </View>

          <View
            style={[
              styles.mapCard,
              { backgroundColor: colors.backgroundGrouped },
            ]}
          >
            <MapView
              style={styles.map}
              initialRegion={
                selectedStation
                  ? {
                      latitude: selectedStation.latitude,
                      longitude: selectedStation.longitude,
                      latitudeDelta: 2.5,
                      longitudeDelta: 2.5,
                    }
                  : DEFAULT_REGION
              }
            >
              {stations.map((station) => (
                <Marker
                  key={station.id}
                  coordinate={{
                    latitude: station.latitude,
                    longitude: station.longitude,
                  }}
                  title={station.station_name}
                  description={`${station.district}, ${station.state}`}
                  pinColor={
                    selectedStation?.id === station.id ? "#FF8A00" : "#1E88E5"
                  }
                  onPress={() => setSelectedStation(station)}
                />
              ))}
            </MapView>
          </View>

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
                marginBottom: 8,
              }}
            >
              Selected Station
            </AppText>
            {selectedStation ? (
              <>
                <AppText
                  size={15}
                  style={{ fontWeight: "600", color: colors.textPrimary }}
                >
                  {selectedStation.station_name}
                </AppText>
                <AppText
                  size={13}
                  style={{ color: colors.textSecondary, marginTop: 4 }}
                >
                  {selectedStation.district}, {selectedStation.state}
                </AppText>
                <AppText
                  size={13}
                  style={{ color: colors.textSecondary, marginTop: 4 }}
                >
                  Status: {selectedStation.status}
                </AppText>
                <AppText
                  size={13}
                  style={{ color: colors.textSecondary, marginTop: 4 }}
                >
                  Lat {selectedStation.latitude.toFixed(4)}, Lng{" "}
                  {selectedStation.longitude.toFixed(4)}
                </AppText>
              </>
            ) : (
              <AppText size={13} style={{ color: colors.textSecondary }}>
                No station available yet.
              </AppText>
            )}
          </View>

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
                marginBottom: 8,
              }}
            >
              Nearby Stations
            </AppText>
            {nearbyStations.length > 0 ? (
              nearbyStations.map((station) => (
                <View key={station.id} style={styles.stationRow}>
                  <AppText
                    size={14}
                    style={{ fontWeight: "600", color: colors.textPrimary }}
                  >
                    {station.station_name}
                  </AppText>
                  <AppText size={12} style={{ color: colors.textSecondary }}>
                    {station.district}, {station.state}
                  </AppText>
                </View>
              ))
            ) : (
              <AppText size={13} style={{ color: colors.textSecondary }}>
                No nearby stations found.
              </AppText>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  logo: {
    width: 150,
    height: 40,
    resizeMode: "contain",
  },
  headerSpacer: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  titleSection: {
    marginBottom: 12,
    alignItems: "center",
  },
  mapCard: {
    borderRadius: 20,
    overflow: "hidden",
    height: 320,
    marginBottom: 16,
  },
  map: {
    flex: 1,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  stationRow: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
});
