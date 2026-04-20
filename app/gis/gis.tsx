import { AppText } from "@/components/common/AppText";
import { useAppContext } from "@/context/AppContext";
import { db } from "@/services/firebase";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { getDistance } from "geolib";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
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

interface FloodStationWithDistance extends FloodStation {
  distanceKm: number;
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

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function isHighFloodChance(status: string) {
  const normalizedStatus = normalizeStatus(status);

  return normalizedStatus === "high" || normalizedStatus === "danger";
}

function getStatusLabel(status: string) {
  if (isHighFloodChance(status)) {
    return "High flood chances";
  }

  if (normalizeStatus(status) === "normal") {
    return "Normal";
  }

  return status;
}

const checkFloodProximity = async (
  userCoords: UserCoords,
  stations: FloodStation[],
  onFloodAlert: (stationName: string, distanceInKm: number) => void,
) => {
  for (const station of stations) {
    // Only care about stations marked as high risk
    if (isHighFloodChance(station.status)) {
      const distance = getDistance(
        { latitude: userCoords.latitude, longitude: userCoords.longitude },
        { latitude: station.latitude, longitude: station.longitude },
      );

      const distanceInKm = distance / 1000;

      if (distanceInKm <= 5) {
        onFloodAlert(station.station_name, distanceInKm);
      }
    }
  }
};

export default function GISMap() {
  const insets = useSafeAreaInsets();
  const { colors, addNotification } = useAppContext();
  const router = useRouter();
  const { t } = useTranslation();
  const [stations, setStations] = useState<FloodStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserCoords | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<FloodStation | null>(
    null,
  );
  const mapViewRef = useRef<MapView | null>(null);

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Location permission denied");
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch (error) {
        console.error("Error getting location:", error);
        setLocationError("Unable to get location");
      }
    };

    getUserLocation();
  }, []);

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
      } catch (error) {
        console.error("Error loading flood stations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStations();
  }, []);

  const nearbyStations = useMemo<FloodStationWithDistance[]>(() => {
    if (!userLocation) {
      return [];
    }

    const PROXIMITY_RADIUS_KM = 5;

    return stations
      .map((station) => {
        const distanceInMeters = getDistance(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          { latitude: station.latitude, longitude: station.longitude },
        );

        return {
          ...station,
          distanceKm: distanceInMeters / 1000,
        };
      })
      .filter((station) => station.distanceKm <= PROXIMITY_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [stations, userLocation]);

  const nearestStation = nearbyStations[0] ?? null;

  useEffect(() => {
    if (nearestStation) {
      setSelectedStation(nearestStation);
      return;
    }

    setSelectedStation(stations[0] ?? null);
  }, [nearestStation, stations]);

  useEffect(() => {
    const runFloodProximityCheck = async () => {
      if (!userLocation || stations.length === 0) {
        return;
      }

      await checkFloodProximity(
        userLocation,
        stations,
        (stationName, distanceInKm) => {
          addNotification({
            type: "alert",
            message: `${stationName} has High flood chances and is ${distanceInKm.toFixed(1)}km away. Move to higher ground.`,
          });
        },
      );
    };

    runFloodProximityCheck();
  }, [addNotification, stations, userLocation]);

  useEffect(() => {
    if (!userLocation || !mapViewRef.current) {
      return;
    }

    mapViewRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.25,
        longitudeDelta: 0.25,
      },
      1000,
    );
  }, [userLocation]);

  const getMarkerColorByStatus = (status: string) => {
    if (isHighFloodChance(status)) {
      return "#D32F2F";
    }

    if (normalizeStatus(status) === "warning") {
      return "#F57C00";
    }

    if (normalizeStatus(status) === "normal") {
      return "#2E7D32";
    }

    return "#1E88E5";
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
            paddingTop: Math.max(0, insets.top * 0.25),
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
          {t("GIS")}
        </AppText>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 32 + insets.bottom },
          ]}
        >
          {/* <View style={styles.titleSection}>
            <AppText
              size={22}
              style={{ fontWeight: "700", color: colors.textPrimary }}
            >
              GIS
            </AppText>
            <AppText size={13} style={{ color: colors.textSecondary }}>
              Flood station overview
            </AppText>
          </View> */}

          <View
            style={[
              styles.mapCard,
              { backgroundColor: colors.backgroundGrouped },
            ]}
          >
            <MapView
              ref={mapViewRef}
              style={styles.map}
              showsUserLocation={Boolean(userLocation)}
              followsUserLocation={false}
              initialRegion={
                userLocation
                  ? {
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                      latitudeDelta: 0.8,
                      longitudeDelta: 0.8,
                    }
                  : selectedStation
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
                  description={`${station.district}, ${station.state} • Status: ${getStatusLabel(station.status)}`}
                  pinColor={getMarkerColorByStatus(station.status)}
                  onPress={() => setSelectedStation(station)}
                />
              ))}
              {userLocation && (
                <Marker
                  coordinate={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  }}
                  title="Your current location"
                  description="Live GPS position"
                  pinColor="#00695C"
                />
              )}
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
                  Status: {getStatusLabel(selectedStation.status)}
                </AppText>
                {userLocation && (
                  <AppText
                    size={13}
                    style={{ color: colors.textSecondary, marginTop: 4 }}
                  >
                    Distance from you:{" "}
                    {distanceKm(userLocation, selectedStation).toFixed(1)} km
                  </AppText>
                )}
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
            {locationError && (
              <AppText size={13} style={{ color: "#D32F2F", marginBottom: 8 }}>
                {locationError}
              </AppText>
            )}
            {nearestStation && (
              <View style={styles.currentStatusCard}>
                <AppText
                  size={14}
                  style={{ fontWeight: "700", color: colors.textPrimary }}
                >
                  Current Flood Status Near You
                </AppText>
                <AppText
                  size={13}
                  style={{ color: colors.textSecondary, marginTop: 4 }}
                >
                  {nearestStation.station_name}
                </AppText>
                <AppText
                  size={13}
                  style={{ color: colors.textSecondary, marginTop: 2 }}
                >
                  Status: {getStatusLabel(nearestStation.status)}
                </AppText>
                <AppText
                  size={13}
                  style={{ color: colors.textSecondary, marginTop: 2 }}
                >
                  Distance: {nearestStation.distanceKm.toFixed(1)} km
                </AppText>
              </View>
            )}
            {nearbyStations.length > 0 ? (
              nearbyStations.map((station, index) => (
                <View key={station.id} style={styles.stationRow}>
                  <AppText
                    size={14}
                    style={{ fontWeight: "600", color: colors.textPrimary }}
                  >
                    {index + 1}. {station.station_name}
                  </AppText>
                  <AppText size={12} style={{ color: colors.textSecondary }}>
                    {station.district}, {station.state}
                  </AppText>
                  <AppText size={12} style={{ color: colors.textSecondary }}>
                    Status: {getStatusLabel(station.status)} •{" "}
                    {station.distanceKm.toFixed(1)} km
                  </AppText>
                </View>
              ))
            ) : (
              <AppText size={13} style={{ color: colors.textSecondary }}>
                {userLocation
                  ? "No flood stations found within 5 km."
                  : "Enable location access to see nearby flood stations."}
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
  currentStatusCard: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "rgba(30, 136, 229, 0.08)",
  },
});
