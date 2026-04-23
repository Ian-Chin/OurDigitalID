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
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, type Region } from "@/components/platform/Map";
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

type StationStatusCategory =
  | "high_flood"
  | "low_water"
  | "normal"
  | "warning"
  | "unknown";

interface AirStatusPoint {
  id: string;
  latitude: number;
  longitude: number;
  aqi: number;
  updatedAt: string;
}

const DEFAULT_REGION: Region = {
  latitude: 4.2105,
  longitude: 101.9758,
  latitudeDelta: 7,
  longitudeDelta: 7,
};

const HARD_CODED_AIR_STATUS_POINTS: AirStatusPoint[] = [
  {
    id: "kl-central",
    latitude: 3.139,
    longitude: 101.6869,
    aqi: 67,
    updatedAt: "20 Apr 2026, 10:30 AM",
  },
  {
    id: "pj",
    latitude: 3.1073,
    longitude: 101.6067,
    aqi: 52,
    updatedAt: "20 Apr 2026, 10:30 AM",
  },
  {
    id: "shah-alam",
    latitude: 3.0733,
    longitude: 101.5185,
    aqi: 41,
    updatedAt: "20 Apr 2026, 10:30 AM",
  },
  {
    id: "cheras",
    latitude: 3.0906,
    longitude: 101.741,
    aqi: 156,
    updatedAt: "20 Apr 2026, 10:30 AM",
  },
];

function getAirQualityLabel(aqi: number) {
  if (aqi >= 151) {
    return "Danger";
  }

  if (aqi >= 101) {
    return "Unhealthy";
  }

  if (aqi >= 51) {
    return "Moderate";
  }

  return "Good";
}

function getDangerPrecautions() {
  return [
    "Wear a mask if you need to go outside.",
    "Avoid outdoor exercise and prolonged exposure.",
    "Keep windows and doors closed.",
    "Use an air purifier if available.",
  ];
}

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

function classifyStationStatus(status: string): StationStatusCategory {
  const normalizedStatus = normalizeStatus(status);

  if (
    normalizedStatus === "high" ||
    normalizedStatus === "danger" ||
    normalizedStatus.includes("high flood") ||
    normalizedStatus.includes("flood")
  ) {
    return "high_flood";
  }

  if (
    normalizedStatus.includes("low water") ||
    normalizedStatus.includes("outage") ||
    normalizedStatus.includes("water outage")
  ) {
    return "low_water";
  }

  if (normalizedStatus === "warning") {
    return "warning";
  }

  if (normalizedStatus === "normal") {
    return "normal";
  }

  return "unknown";
}

function isHighFloodChance(status: string) {
  return classifyStationStatus(status) === "high_flood";
}

function isLowWaterOutageRisk(status: string) {
  return classifyStationStatus(status) === "low_water";
}

function getStatusLabel(status: string) {
  const category = classifyStationStatus(status);

  if (category === "high_flood") {
    return "High flood chances";
  }

  if (category === "low_water") {
    return "Low water level (possible water outage)";
  }

  if (category === "normal") {
    return "Normal";
  }

  if (category === "warning") {
    return "Warning";
  }

  return status;
}

function getPointerTypeLabel(status: string) {
  const category = classifyStationStatus(status);

  if (category === "high_flood") {
    return "High Flood Chance";
  }

  if (category === "low_water") {
    return "Low Water Level";
  }

  if (category === "normal") {
    return "Normal Water Level";
  }

  if (category === "warning") {
    return "Warning Water Level";
  }

  return "Unknown Water Level";
}

function getFloodPrecautions(category: StationStatusCategory) {
  if (category === "high_flood") {
    return [
      "Prepare emergency bag (documents, medicine, power bank).",
      "Prepare drinking water and dry food for at least 72 hours.",
      "Avoid crossing flooded roads and fast-moving water.",
    ];
  }

  if (category === "low_water") {
    return [
      "Store clean water in advance for essential use.",
      "Prioritize drinking and cooking water first.",
      "Follow local utility updates for possible water outage.",
    ];
  }

  return [];
}

const checkFloodProximity = async (
  userCoords: UserCoords,
  stations: FloodStation[],
  onFloodAlert: (
    stationName: string,
    distanceInKm: number,
    statusLabel: string,
  ) => void,
) => {
  for (const station of stations) {
    // Alert for high flood chance or low water level outage risk
    if (
      isHighFloodChance(station.status) ||
      isLowWaterOutageRisk(station.status)
    ) {
      const distance = getDistance(
        { latitude: userCoords.latitude, longitude: userCoords.longitude },
        { latitude: station.latitude, longitude: station.longitude },
      );

      const distanceInKm = distance / 1000;

      if (distanceInKm <= 5) {
        onFloodAlert(
          station.station_name,
          distanceInKm,
          getStatusLabel(station.status),
        );
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
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [canAskLocationPermissionAgain, setCanAskLocationPermissionAgain] =
    useState(true);
  const [selectedStation, setSelectedStation] = useState<FloodStation | null>(
    null,
  );
  const mapViewRef = useRef<MapView | null>(null);

  const requestAndSetUserLocation = async () => {
    setIsRequestingLocation(true);

    try {
      const permissionResponse =
        await Location.requestForegroundPermissionsAsync();
      setCanAskLocationPermissionAgain(permissionResponse.canAskAgain);

      if (permissionResponse.status !== "granted") {
        setUserLocation(null);
        setLocationError(
          permissionResponse.canAskAgain
            ? "Location permission denied"
            : "Location permission denied. Please enable it in Settings.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationError(null);
    } catch (error) {
      console.error("Error getting location:", error);
      setLocationError("Unable to get location");
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const handleOpenLocationSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error("Error opening settings:", error);
      setLocationError("Unable to open device settings");
    }
  };

  useEffect(() => {
    requestAndSetUserLocation();
  }, []);

  useEffect(() => {
    const loadStations = async () => {
      try {
        const snapshot = await getDocs(collection(db, "flood_stations"));
        const fallbackStatuses = ["high", "normal", "low water level"];

        const loadedStations: FloodStation[] = snapshot.docs
          .map((document, index) => {
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
              status:
                typeof data.status === "string" && data.status.trim().length > 0
                  ? data.status
                  : fallbackStatuses[index % fallbackStatuses.length],
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

  const nearestSafetyStation = useMemo(() => {
    if (!userLocation) {
      return null;
    }

    const safeStations = stations.filter((station) => {
      const category = classifyStationStatus(station.status);
      return category === "normal" || category === "warning";
    });

    if (safeStations.length === 0) {
      return null;
    }

    return safeStations
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
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
  }, [stations, userLocation]);

  const nearestAirStatus = useMemo(() => {
    if (HARD_CODED_AIR_STATUS_POINTS.length === 0) {
      return null;
    }

    if (!userLocation) {
      return {
        ...HARD_CODED_AIR_STATUS_POINTS[0],
        distanceKm: null as number | null,
      };
    }

    const nearest = HARD_CODED_AIR_STATUS_POINTS.map((airPoint) => {
      const meters = getDistance(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        { latitude: airPoint.latitude, longitude: airPoint.longitude },
      );

      return {
        ...airPoint,
        distanceKm: meters / 1000,
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm)[0];

    return nearest;
  }, [userLocation]);

  const airQualityLabel = useMemo(() => {
    if (!nearestAirStatus) {
      return "Unknown";
    }

    return getAirQualityLabel(nearestAirStatus.aqi);
  }, [nearestAirStatus]);

  const showDangerPrecautions = airQualityLabel === "Danger";

  const nearestStationCategory = nearestStation
    ? classifyStationStatus(nearestStation.status)
    : "unknown";
  const shouldPrioritizeFloodCard =
    nearestStationCategory === "high_flood" ||
    nearestStationCategory === "low_water";

  const shouldShowFloodPrecautions =
    nearestStationCategory === "high_flood" ||
    nearestStationCategory === "low_water";

  const nearestSafetyStationText = nearestSafetyStation
    ? `${nearestSafetyStation.station_name} (${nearestSafetyStation.distanceKm.toFixed(1)} km)`
    : "No nearby safety station found";

  const floodPrecautions = useMemo(() => {
    return getFloodPrecautions(nearestStationCategory);
  }, [nearestStationCategory]);

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
        (stationName, distanceInKm, statusLabel) => {
          addNotification({
            type: "alert",
            message: `${stationName} status: ${statusLabel}. Distance ${distanceInKm.toFixed(1)}km from you.`,
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
    const category = classifyStationStatus(status);

    if (category === "high_flood") {
      return "#D32F2F";
    }

    if (category === "warning") {
      return "#F57C00";
    }

    if (category === "low_water") {
      return "#1565C0";
    }

    if (category === "normal") {
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
                  title={`${getPointerTypeLabel(station.status)} - ${station.station_name}`}
                  description={`${station.district}, ${station.state} • Water level: ${getPointerTypeLabel(station.status)} • Status: ${getStatusLabel(station.status)}`}
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
            {shouldPrioritizeFloodCard && nearestStation ? (
              <>
                <AppText
                  size={16}
                  style={{
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Flood Status
                </AppText>
                <View
                  style={[
                    styles.airStatusCard,
                    { backgroundColor: colors.background, marginBottom: 12 },
                  ]}
                >
                  <View style={styles.airStatusHeader}>
                    <AppText
                      size={14}
                      style={{ fontWeight: "700", color: colors.textPrimary }}
                    >
                      Current Flood Status Near You
                    </AppText>
                    <View style={styles.airBadge}>
                      <AppText size={12} style={styles.airBadgeText}>
                        {getPointerTypeLabel(nearestStation.status)}
                      </AppText>
                    </View>
                  </View>
                  <AppText
                    size={14}
                    style={{ fontWeight: "600", color: colors.textPrimary }}
                  >
                    {nearestStation.station_name}
                  </AppText>
                  <AppText
                    size={12}
                    style={{ color: colors.textSecondary, marginTop: 4 }}
                  >
                    Status: {getStatusLabel(nearestStation.status)}
                  </AppText>
                  <AppText
                    size={12}
                    style={{ color: colors.textSecondary, marginTop: 2 }}
                  >
                    Distance: {nearestStation.distanceKm.toFixed(1)} km
                  </AppText>
                  {shouldShowFloodPrecautions && (
                    <View style={styles.precautionWrap}>
                      <AppText
                        size={13}
                        style={{ color: "#C62828", fontWeight: "700" }}
                      >
                        Precautions
                      </AppText>
                      <AppText
                        size={12}
                        style={{ color: colors.textSecondary, marginTop: 4 }}
                      >
                        Nearest safety station: {nearestSafetyStationText}
                      </AppText>
                      <AppText
                        size={12}
                        style={{
                          color: colors.textSecondary,
                          marginTop: 6,
                          fontWeight: "700",
                        }}
                      >
                        Prepare now
                      </AppText>
                      {floodPrecautions.map((note) => (
                        <AppText
                          key={note}
                          size={12}
                          style={{ color: colors.textSecondary, marginTop: 4 }}
                        >
                          • {note}
                        </AppText>
                      ))}
                    </View>
                  )}
                </View>
              </>
            ) : null}

            <AppText
              size={16}
              style={{
                fontWeight: "700",
                color: colors.textPrimary,
                marginBottom: 8,
              }}
            >
              Air Status
            </AppText>
            <View
              style={[
                styles.airStatusCard,
                {
                  backgroundColor: colors.background,
                  marginBottom:
                    !shouldPrioritizeFloodCard && nearestStation ? 12 : 0,
                },
              ]}
            >
              <View style={styles.airStatusHeader}>
                <AppText
                  size={14}
                  style={{ fontWeight: "700", color: colors.textPrimary }}
                >
                  Current Air Quality
                </AppText>
                <View style={styles.airBadge}>
                  <AppText size={12} style={styles.airBadgeText}>
                    {airQualityLabel}
                  </AppText>
                </View>
              </View>
              <AppText
                size={24}
                style={{ fontWeight: "700", color: "#1E88E5" }}
              >
                AQI {nearestAirStatus?.aqi ?? "--"}
              </AppText>
              <AppText
                size={12}
                style={{ color: colors.textSecondary, marginTop: 4 }}
              >
                Updated: {nearestAirStatus?.updatedAt ?? "N/A"}
              </AppText>

              {showDangerPrecautions ? (
                <View style={styles.precautionWrap}>
                  <AppText
                    size={13}
                    style={{ color: "#C62828", fontWeight: "700" }}
                  >
                    Precautions (Danger)
                  </AppText>
                  {getDangerPrecautions().map((item) => (
                    <AppText
                      key={item}
                      size={12}
                      style={{ color: colors.textSecondary, marginTop: 4 }}
                    >
                      • {item}
                    </AppText>
                  ))}
                </View>
              ) : (
                <AppText
                  size={12}
                  style={{ color: colors.textSecondary, marginTop: 8 }}
                >
                  No emergency precautions required right now.
                </AppText>
              )}
            </View>

            {!shouldPrioritizeFloodCard && nearestStation ? (
              <>
                <AppText
                  size={16}
                  style={{
                    fontWeight: "700",
                    color: colors.textPrimary,
                    marginBottom: 8,
                  }}
                >
                  Flood Status
                </AppText>
                <View
                  style={[
                    styles.airStatusCard,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <View style={styles.airStatusHeader}>
                    <AppText
                      size={14}
                      style={{ fontWeight: "700", color: colors.textPrimary }}
                    >
                      Current Flood Status Near You
                    </AppText>
                    <View style={styles.airBadge}>
                      <AppText size={12} style={styles.airBadgeText}>
                        {getPointerTypeLabel(nearestStation.status)}
                      </AppText>
                    </View>
                  </View>
                  <AppText
                    size={14}
                    style={{ fontWeight: "600", color: colors.textPrimary }}
                  >
                    {nearestStation.station_name}
                  </AppText>
                  <AppText
                    size={12}
                    style={{ color: colors.textSecondary, marginTop: 4 }}
                  >
                    Status: {getStatusLabel(nearestStation.status)}
                  </AppText>
                  <AppText
                    size={12}
                    style={{ color: colors.textSecondary, marginTop: 2 }}
                  >
                    Distance: {nearestStation.distanceKm.toFixed(1)} km
                  </AppText>
                  {shouldShowFloodPrecautions && (
                    <View style={styles.precautionWrap}>
                      <AppText
                        size={13}
                        style={{ color: "#C62828", fontWeight: "700" }}
                      >
                        Precautions
                      </AppText>
                      <AppText
                        size={12}
                        style={{ color: colors.textSecondary, marginTop: 4 }}
                      >
                        Nearest safety station: {nearestSafetyStationText}
                      </AppText>
                      <AppText
                        size={12}
                        style={{
                          color: colors.textSecondary,
                          marginTop: 6,
                          fontWeight: "700",
                        }}
                      >
                        Prepare now
                      </AppText>
                      {floodPrecautions.map((note) => (
                        <AppText
                          key={note}
                          size={12}
                          style={{ color: colors.textSecondary, marginTop: 4 }}
                        >
                          • {note}
                        </AppText>
                      ))}
                    </View>
                  )}
                </View>
              </>
            ) : null}
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
              <View style={styles.locationErrorWrap}>
                <AppText
                  size={13}
                  style={{ color: "#D32F2F", marginBottom: 8 }}
                >
                  {locationError}
                </AppText>
                <View style={styles.locationActionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.locationActionButton,
                      { backgroundColor: colors.primary },
                      isRequestingLocation &&
                        styles.locationActionButtonDisabled,
                    ]}
                    onPress={requestAndSetUserLocation}
                    disabled={isRequestingLocation}
                  >
                    <AppText size={12} style={styles.locationActionButtonText}>
                      {isRequestingLocation
                        ? "Requesting..."
                        : "Allow location"}
                    </AppText>
                  </TouchableOpacity>

                  {!canAskLocationPermissionAgain && (
                    <TouchableOpacity
                      style={[
                        styles.locationActionButton,
                        {
                          backgroundColor: "transparent",
                          borderWidth: 1,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={handleOpenLocationSettings}
                    >
                      <AppText
                        size={12}
                        style={{ color: colors.primary, fontWeight: "600" }}
                      >
                        Open settings
                      </AppText>
                    </TouchableOpacity>
                  )}
                </View>
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
  locationErrorWrap: {
    marginBottom: 8,
  },
  locationActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  locationActionButton: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationActionButtonDisabled: {
    opacity: 0.6,
  },
  locationActionButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
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
  airStatusCard: {
    borderRadius: 14,
    padding: 12,
  },
  airStatusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  airBadge: {
    borderRadius: 999,
    backgroundColor: "rgba(245, 124, 0, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  airBadgeText: {
    color: "#F57C00",
    fontWeight: "700",
  },
  precautionWrap: {
    marginTop: 10,
  },
});
