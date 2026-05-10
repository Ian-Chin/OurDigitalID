import { AppText } from "@/components/common/AppText";
import { SearchBar } from "@/components/searchbar/search-bar";
import { Elevation, Radii } from "@/constants/colors";
import { vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { getDistance } from "geolib";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

import MapView, { Marker, Polyline } from "@/components/platform/Map";
import { GOOGLE_MAPS_API_KEY, TravelMode } from "@/services/maps";

const { width } = Dimensions.get("window");
const FALLBACK_MAP_CENTER = { latitude: 3.139, longitude: 101.6869 };

const newsImageMap: Record<string, any> = {
  "1": require("../../assets/images/mykasih.png"),
  "2": require("../../assets/images/id_illustration.png"),
};

interface Service {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  waitTime?: number;
  distance?: number;
}

const HOME_SERVICE_MARKER_COLOR = "#06B6D4";
const ROUTE_LINE_COLOR = "#1d28a3";
const ROUTE_ZOOM_DELTA = 0.02;

// Helper function to get pin color based on wait time
const getPinColorByWaitTime = (waitTime?: number): string => {
  if (!waitTime) return "#06B6D4"; // default blue
  if (waitTime <= 15) return "#10B981"; // green - short wait
  if (waitTime <= 30) return "#F59E0B"; // orange/yellow - medium wait
  return "#EF4444"; // red - long wait
};

// Helper to get a light panel background based on wait time
const getPanelBgByWaitTime = (waitTime?: number): string => {
  if (!waitTime) return "#FFFFFF";
  if (waitTime <= 15) return "#ECFDF5"; // light green
  if (waitTime <= 30) return "#FFFBEB"; // light orange/yellow
  return "#FEF2F2"; // light red
};

const NEARBY_SERVICES: Service[] = [
  {
    id: "1",
    name: "JPJ Office",
    latitude: 3.0485,
    longitude: 101.5605,
    type: "Transport & Licensing",
    waitTime: 4,
  },
  {
    id: "2",
    name: "Healthcare Clinic",
    latitude: 3.0515,
    longitude: 101.555,
    type: "Healthcare",
    waitTime: 13,
  },
  {
    id: "3",
    name: "Tax Service Center",
    latitude: 3.055868,
    longitude: 101.692481,
    type: "Tax & Finance",
    waitTime: 25,
  },
  {
    id: "4",
    name: "EPF Office",
    latitude: 4.55643,
    longitude: 101.614787,
    type: "Employment Benefits",
    waitTime: 3,
  },
  {
    id: "6",
    name: "Digital Services",
    latitude: 3.059269,
    longitude: 101.671787,
    type: "Identity Documents",
    waitTime: 15,
  },
  {
    id: "8",
    name: "License Renewal",
    latitude: 3.053743,
    longitude: 101.670194,
    type: "Transport & Licensing",
    waitTime: 28,
  },
  {
    id: "9",
    name: "Document Center",
    latitude: 3.05536,
    longitude: 101.695729,
    type: "Identity Documents",
    waitTime: 18,
  },
  {
    id: "11",
    name: "License Renewal Center",
    latitude: 3.123506,
    longitude: 101.615624,
    type: "Transport & Licensing",
    waitTime: 28,
  },
  {
    id: "13",
    name: "KWSP EPF Branch",
    latitude: 3.130142,
    longitude: 101.637664,
    type: "Employment Benefits",
    waitTime: 2,
  },
  {
    id: "14",
    name: "Document Processing",
    latitude: 4.557652,
    longitude: 101.0882,
    type: "Identity Documents",
    waitTime: 20,
  },
  {
    id: "15",
    name: "Tax Office",
    latitude: 1.553699,
    longitude: 103.624764,
    type: "Tax & Finance",
    waitTime: 14,
  },
  {
    id: "16",
    name: "Transport Services",
    latitude: 3.096439,
    longitude: 101.555,
    type: "Transport & Licensing",
    waitTime: 6,
  },
  {
    id: "17",
    name: "Medical Clinic",
    latitude: 3.116651,
    longitude: 101.548,
    type: "Healthcare",
    waitTime: 9,
  },
  {
    id: "18",
    name: "EPF Information",
    latitude: 1.588027,
    longitude: 103.644915,
    type: "Employment Benefits",
    waitTime: 12,
  },
  {
    id: "19",
    name: "ID Services",
    latitude: 3.0705,
    longitude: 101.555,
    type: "Identity Documents",
    waitTime: 24,
  },
  {
    id: "20",
    name: "APU Campus Clinic",
    latitude: 1.544131,
    longitude: 103.648104,
    type: "Healthcare",
    waitTime: 10,
  },
  {
    id: "21",
    name: "Transport Services",
    latitude: 1.564491,
    longitude: 103.641129,
    type: "Transport & Licensing",
    waitTime: 22,
  },
  {
    id: "23",
    name: "JPJ Main Office",
    latitude: 3.139,
    longitude: 101.6869,
    type: "Transport & Licensing",
    waitTime: 45,
  },
  {
    id: "24",
    name: "Immigration Department",
    latitude: 1.571227,
    longitude: 103.621180,
    type: "Identity Documents",
    waitTime: 50,
  },
  {
    id: "25",
    name: "Healthcare Hospital",
    latitude: 1.559710,
    longitude: 103.632388,
    type: "Healthcare",
    waitTime: 70,
  },
  {
    id: "26",
    name: "EPF KL Main Office",
    latitude: 3.128,
    longitude: 101.68,
    type: "Employment Benefits",
    waitTime: 35,
  },
  {
    id: "27",
    name: "Tax Office - KL Central",
    latitude: 3.138,
    longitude: 101.685,
    type: "Tax & Finance",
    waitTime: 30,
  },
  {
    id: "32",
    name: "Financial Services",
    latitude: 3.123,
    longitude: 101.695,
    type: "Tax & Finance",
    waitTime: 22,
  },
  {
    id: "33",
    name: "EPF Branch",
    latitude: 1.558410,
    longitude: 103.642717,
    type: "Employment Benefits",
    waitTime: 32,
  },
  {
    id: "34",
    name: "Medical Facility - Taman Desa",
    latitude: 3.085,
    longitude: 101.695,
    type: "Healthcare",
    waitTime: 6,
  },
  {
    id: "35",
    name: "Transport Services",
    latitude: 1.520533,
    longitude: 103.687383,
    type: "Transport & Licensing",
    waitTime: 27,
  },
];

const NEWS_DATA = [
  {
    id: "1",
    title: "My Kasih 2026",
    blurb: "Sumbangan Asas Rahmah. Review your benefits here.",
    tag: "Benefits",
  },
  {
    id: "2",
    title: "New Digital ID Features",
    blurb: "Faster logins and secure transactions across government services.",
    tag: "Update",
  },
];

const NEWS_ITEM_WIDTH = width - 32;
const NEWS_ITEM_OFFSET = NEWS_ITEM_WIDTH + 12;

// ─────────────────────────────────────────────────────────────────────────────
// Action tile
// ─────────────────────────────────────────────────────────────────────────────
interface ActionTileProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  fg: string;
  onPress: () => void;
}
const ActionTile = memo(({ label, icon, bg, fg, onPress }: ActionTileProps) => {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: false }}
      style={({ pressed }) => [
        styles.actionTile,
        { backgroundColor: bg, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <View
        style={[
          styles.actionIconWrap,
          { backgroundColor: "rgba(255,255,255,0.45)" },
        ]}
      >
        <Ionicons name={icon} size={20} color={fg} />
      </View>
      <AppText
        size={12}
        style={{
          color: fg,
          fontWeight: "700",
          marginTop: 8,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Service row
// ─────────────────────────────────────────────────────────────────────────────
const ServiceRow = memo(
  ({
    service,
    textSecondary,
    bg,
    pinColor,
    onPress,
  }: {
    service: Service;
    textSecondary: string;
    bg: string;
    pinColor?: string;
    onPress: (s: Service) => void;
  }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.serviceCard, { backgroundColor: bg }]}
      onPress={() => onPress(service)}
    >
      <View
        style={[
          styles.servicePin,
          {
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: pinColor ?? "#10B981",
          },
        ]}
      >
        <Ionicons name="business" size={14} color={pinColor ?? "#10B981"} />
      </View>
      <View style={styles.serviceInfo}>
        <AppText
          size={13}
          style={{ fontWeight: "700", marginBottom: 2, color: "#000" }}
        >
          {service.name}
        </AppText>
        <AppText size={11} style={{ color: textSecondary }} numberOfLines={1}>
          {service.type}
        </AppText>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View style={styles.distPill}>
          <Ionicons name="navigate" size={10} color="#0891B2" />
          <AppText
            size={11}
            style={{ fontWeight: "700", color: "#0891B2", marginLeft: 3 }}
          >
            {service.distance?.toFixed(1)}km
          </AppText>
        </View>
        <AppText
          size={10}
          style={{ fontWeight: "600", color: pinColor ?? "#D97706" }}
        >
          ~{service.waitTime}m wait
        </AppText>
      </View>
    </TouchableOpacity>
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// News card
// ─────────────────────────────────────────────────────────────────────────────
const NewsCard = memo(
  ({ item, secondary }: { item: any; secondary: string }) => (
    <View
      style={[
        styles.newsItemContainer,
        Elevation.sm,
        { shadowColor: "#0B1220" },
      ]}
    >
      <Image
        source={newsImageMap[item.id]}
        style={styles.newsImagePlaceholder}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(11,18,32,0.78)"]}
        style={styles.newsImageOverlay}
      />
      <View style={styles.newsTagPill}>
        <AppText
          size={10}
          style={{ color: "#FFF", fontWeight: "700", letterSpacing: 0.4 }}
        >
          {item.tag}
        </AppText>
      </View>
      <View style={styles.newsContent}>
        <AppText
          size={15}
          style={{ fontWeight: "800", marginBottom: 4, color: "#FFF" }}
        >
          {item.title}
        </AppText>
        <AppText
          size={12}
          style={{ color: "rgba(255,255,255,0.85)" }}
          numberOfLines={2}
        >
          {item.blurb}
        </AppText>
      </View>
    </View>
  ),
);

export default function HomeScreen() {
  const router = useRouter();
  const { colors, userProfile } = useAppContext();
  const { t } = useTranslation();
  const userName = userProfile?.fullName || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[] | null
  >(null);
  const [routeColor, setRouteColor] = useState<string>(ROUTE_LINE_COLOR);
  const [travelMode, setTravelMode] = useState<TravelMode>("driving");
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [routeLabelCoord, setRouteLabelCoord] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const mapViewRef = useRef<any>(null);
  const currentIndexRef = useRef(0);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const isUserDraggingRef = useRef(false);

  // Location
  useEffect(() => {
    (async () => {
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
      } catch (e) {
        setLocationError("Unable to get location");
      }
    })();
  }, []);

  // Compute nearby services without state ping-pong
  const filteredServices = useMemo(() => {
    const PROXIMITY_RADIUS_KM = 5;
    const anchor = userLocation ?? FALLBACK_MAP_CENTER;
    const withDist = NEARBY_SERVICES.map((service) => {
      const meters = getDistance(anchor, {
        latitude: service.latitude,
        longitude: service.longitude,
      });
      return { ...service, distance: meters / 1000 };
    });
    if (userLocation) {
      return withDist
        .filter((s) => (s.distance ?? Infinity) <= PROXIMITY_RADIUS_KM)
        .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
    return withDist.sort((a, b) => (a.waitTime ?? 0) - (b.waitTime ?? 0));
  }, [userLocation]);

  // Auto-rotate news (only 2 items, looped via modulo — no memory waste)
  useEffect(() => {
    autoScrollIntervalRef.current = setInterval(() => {
      if (isUserDraggingRef.current) return;
      currentIndexRef.current =
        (currentIndexRef.current + 1) % NEWS_DATA.length;
      flatListRef.current?.scrollToOffset({
        offset: currentIndexRef.current * NEWS_ITEM_OFFSET,
        animated: true,
      });
    }, 4500);
    return () => {
      if (autoScrollIntervalRef.current)
        clearInterval(autoScrollIntervalRef.current);
    };
  }, []);

  const handleActionPress = useCallback(
    (route: string) => router.push(route as any),
    [router],
  );

  // Decode Google's encoded polyline into array of coords
  const decodePolyline = (encoded: string) => {
    const coords: { latitude: number; longitude: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return coords;
  };

  const fetchDirections = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    mode: TravelMode = "driving",
  ) => {
    try {
      setRouteLoading(true);
      setRouteError(null);
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destStr = `${destination.latitude},${destination.longitude}`;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
      console.log("Fetching directions from:", originStr, "to:", destStr);
      const res = await fetch(url);
      const data = await res.json();
      console.log("Directions API response:", data);
      if (data.routes && data.routes.length > 0) {
        const encoded = data.routes[0].overview_polyline?.points;
        const leg = data.routes[0].legs?.[0];
        if (encoded) {
          const coords = decodePolyline(encoded);
          setRouteCoords(coords);
          setRouteLabelCoord(coords[Math.floor(coords.length / 2)] ?? null);
          setRouteInfo({
            distance: leg?.distance?.text || "N/A",
            duration: leg?.duration?.text || "N/A",
          });
          console.log("Route decoded. Coords:", coords.length);
          setRouteLoading(false);
          return { coords, raw: data.routes[0] };
        }
      }
      setRouteError("No route found");
      setRouteCoords(null);
      setRouteLabelCoord(null);
      setRouteLoading(false);
      return null;
    } catch (e) {
      const err = e instanceof Error ? e.message : "Unknown error";
      console.error("Directions API error:", err);
      setRouteError(err);
      setRouteCoords(null);
      setRouteLabelCoord(null);
      setRouteLoading(false);
      return null;
    }
  };

  const handleServiceCardPress = useCallback(
    async (service: Service) => {
      if (selectedServiceId === service.id && routeCoords?.length) {
        return;
      }

      setSelectedServiceId(service.id);

      if (!userLocation) {
        setRouteCoords(null);
        return;
      }

      setRouteColor(ROUTE_LINE_COLOR);
      const result = await fetchDirections(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: service.latitude, longitude: service.longitude },
        travelMode,
      );

      const targetLatitude = (userLocation.latitude + service.latitude) / 2;
      const targetLongitude = (userLocation.longitude + service.longitude) / 2;
      mapViewRef.current?.animateToRegion(
        {
          latitude: targetLatitude,
          longitude: targetLongitude,
          latitudeDelta: ROUTE_ZOOM_DELTA,
          longitudeDelta: ROUTE_ZOOM_DELTA,
        },
        900,
      );

      if (result?.coords && mapViewRef.current?.fitToCoordinates) {
        try {
          mapViewRef.current.fitToCoordinates(result.coords, {
            edgePadding: { top: 20, right: 20, bottom: 50, left: 20 },
            animated: true,
          });
        } catch (e) {
          // ignore if fitToCoordinates not available
        }
      }
    },
    [routeCoords?.length, selectedServiceId, userLocation, travelMode],
  );

  const handleCenterMap = useCallback(() => {
    const c = userLocation ?? FALLBACK_MAP_CENTER;
    mapViewRef.current?.animateToRegion(
      {
        latitude: c.latitude,
        longitude: c.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      900,
    );
  }, [userLocation]);

  // Stagger animations
  const heroAnim = useFadeInUp(stagger(0, 90));
  const actionsAnim = useFadeInUp(stagger(1, 90));
  const newsAnim = useFadeInUp(stagger(2, 90));
  const noticeAnim = useFadeInUp(stagger(3, 90));
  const queueAnim = useFadeInUp(stagger(4, 90));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      >
        {/* Hero / Search Card */}
        <Animated.View style={[styles.heroSection, heroAnim]}>
          <View style={styles.greetingRow}>
            <View style={{ flex: 1 }}>
              <AppText
                size={11}
                style={{
                  color: colors.textSecondary,
                  letterSpacing: 1.4,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                {t("welcome")}
              </AppText>
              <AppText
                size={22}
                style={{
                  fontWeight: "800",
                  marginTop: 2,
                  color: colors.textPrimary,
                  letterSpacing: -0.4,
                }}
                numberOfLines={2}
              >
                {userName || "Citizen"}
              </AppText>
              <AppText
                size={13}
                style={{ color: colors.textMuted, marginTop: 2 }}
              >
                What can we help you with today?
              </AppText>
            </View>
            <View style={styles.statusChip}>
              <View style={styles.statusDotGreen} />
              <AppText
                size={11}
                style={{ color: colors.success, fontWeight: "700" }}
              >
                Verified
              </AppText>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
          </View>
        </Animated.View>

        {/* Action Tiles */}
        <Animated.View style={[styles.actionButtonsContainer, actionsAnim]}>
          <ActionTile
            label={t("GIS")}
            icon="map"
            bg="#FFF7E6"
            fg="#B45309"
            onPress={() => handleActionPress("/gis/gis")}
          />
          <ActionTile
            label={t("scanDocument")}
            icon="scan"
            bg="#E0F7FA"
            fg="#0891B2"
            onPress={() => handleActionPress("/service/scan")}
          />
          <ActionTile
            label={t("Report")}
            icon="alert-circle"
            bg="#FEF2F2"
            fg="#B91C1C"
            onPress={() => handleActionPress("/home/Report")}
          />
        </Animated.View>

        {/* Latest News */}
        <Animated.View style={[styles.section, newsAnim]}>
          <View style={styles.sectionHeader}>
            <AppText
              size={16}
              style={{ fontWeight: "800", color: colors.textPrimary }}
            >
              {t("latestNews")}
            </AppText>
            <View style={styles.sectionHeaderRight}>
              <View style={styles.liveDot} />
              <AppText
                size={11}
                style={{ color: colors.success, fontWeight: "700" }}
              >
                LIVE
              </AppText>
            </View>
          </View>
          <FlatList
            ref={flatListRef}
            data={NEWS_DATA}
            keyExtractor={(item) => item.id}
            horizontal
            snapToInterval={NEWS_ITEM_OFFSET}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={() => (isUserDraggingRef.current = true)}
            onScrollEndDrag={() => (isUserDraggingRef.current = false)}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / NEWS_ITEM_OFFSET,
              );
              currentIndexRef.current = idx % NEWS_DATA.length;
            }}
            removeClippedSubviews
            initialNumToRender={2}
            renderItem={({ item }) => (
              <NewsCard item={item} secondary={colors.textSecondary} />
            )}
          />
        </Animated.View>

        {/* Important Notice */}
        <Animated.View style={[styles.section, noticeAnim]}>
          <AppText
            size={16}
            style={{
              fontWeight: "800",
              marginBottom: vs(12),
              color: colors.textPrimary,
            }}
          >
            {t("importantNotice")}
          </AppText>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleActionPress("/home/report?type=disaster")}
          >
            <View
              style={[
                styles.noticeContainer,
                Elevation.sm,
                { shadowColor: "#0B1220" },
              ]}
            >
              <Image
                source={require("../../assets/images/weather.jpg")}
                style={styles.noticeImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(11,31,58,0.0)", "rgba(11,31,58,0.85)"]}
                style={styles.noticeOverlay}
              />
              <View style={styles.noticeBadge}>
                <Ionicons name="warning" size={12} color="#FFF" />
                <AppText
                  size={10}
                  style={{ color: "#FFF", fontWeight: "800", marginLeft: 4 }}
                >
                  ALERT
                </AppText>
              </View>
              <View style={styles.noticeContent}>
                <AppText
                  size={16}
                  style={{ fontWeight: "800", color: "#FFF", marginBottom: 2 }}
                >
                  Flood alert · Melaka
                </AppText>
                <AppText size={12} style={{ color: "rgba(255,255,255,0.85)" }}>
                  Alor Gajah · Submit a disaster report →
                </AppText>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Live Queue / Map */}
        <Animated.View style={[styles.section, queueAnim]}>
          {locationError ? (
            <AppText
              size={12}
              style={{ color: colors.textSecondary, marginBottom: vs(8) }}
            >
              {locationError}. Showing fallback ordering.
            </AppText>
          ) : null}
          <View style={styles.queueHeader}>
            <View>
              <AppText
                size={16}
                style={{ fontWeight: "800", color: colors.textPrimary }}
              >
                {t("liveQueue")}
              </AppText>
              <AppText
                size={11}
                style={{ color: colors.textSecondary, marginTop: 2 }}
              >
                {filteredServices.length} centres within 5km
              </AppText>
            </View>
            <TouchableOpacity
              onPress={handleCenterMap}
              style={[
                styles.locateBtn,
                { backgroundColor: colors.primarySoft },
              ]}
              hitSlop={8}
            >
              <Ionicons name="locate" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.queueContainer,
              {
                backgroundColor: colors.backgroundElevated,
                borderColor: colors.borderLight,
              },
              Elevation.sm,
              { shadowColor: "#0B1220" },
            ]}
          >
            {!userLocation && !locationError ? (
              <View style={{ paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={styles.mapWrapper}>
                <View style={styles.mapClip}>
                  <MapView
                    ref={mapViewRef}
                    style={styles.nearbyServicesMap}
                    initialRegion={{
                      latitude: (userLocation ?? FALLBACK_MAP_CENTER).latitude,
                      longitude: (userLocation ?? FALLBACK_MAP_CENTER)
                        .longitude,
                      latitudeDelta: 0.1,
                      longitudeDelta: 0.1,
                    }}
                  >
                    {userLocation ? (
                      <Marker
                        coordinate={{
                          latitude: userLocation.latitude,
                          longitude: userLocation.longitude,
                        }}
                        title="Your Location"
                        pinColor="#06B6D4"
                      />
                    ) : null}
                    {NEARBY_SERVICES.map((service) => (
                      <Marker
                        key={service.id}
                        coordinate={{
                          latitude: service.latitude,
                          longitude: service.longitude,
                        }}
                        title={service.name}
                        description={service.type}
                        pinColor={getPinColorByWaitTime(service.waitTime)}
                      />
                    ))}
                    {routeCoords ? (
                      <Polyline
                        coordinates={routeCoords}
                        strokeWidth={4}
                        strokeColor={routeColor}
                        lineDashPattern={[0]}
                        geodesic
                      />
                    ) : null}
                    {routeInfo && routeLabelCoord ? (
                      <Marker
                        coordinate={routeLabelCoord}
                        anchor={{ x: 0.5, y: 0.5 }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            backgroundColor: routeColor,
                            borderRadius: 999,
                            borderWidth: 2,
                            borderColor: "#FFF",
                            shadowColor: "#000",
                            shadowOpacity: 0.18,
                            shadowRadius: 6,
                            shadowOffset: { width: 0, height: 2 },
                            elevation: 3,
                          }}
                        >
                          <AppText
                            size={11}
                            style={{ color: "#FFF", fontWeight: "700" }}
                          >
                            {routeInfo.duration} ETA
                          </AppText>
                        </View>
                      </Marker>
                    ) : null}
                  </MapView>
                </View>

                <View style={styles.servicesListHeader}>
                  <AppText
                    size={13}
                    style={{ fontWeight: "700", color: colors.textPrimary }}
                  >
                    Nearby Services
                  </AppText>
                  <AppText size={11} style={{ color: colors.textSecondary }}>
                    Sorted by distance
                  </AppText>
                </View>

                {routeLoading && (
                  <View
                    style={{
                      padding: 16,
                      backgroundColor: colors.primarySoft,
                      borderRadius: 12,
                      marginBottom: 12,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                      style={{ marginRight: 12 }}
                    />
                    <AppText
                      size={13}
                      style={{ color: colors.primary, fontWeight: "600" }}
                    >
                      Calculating route...
                    </AppText>
                  </View>
                )}

                {routeError && (
                  <View
                    style={{
                      padding: 16,
                      backgroundColor: "#FEF2F2",
                      borderRadius: 12,
                      marginBottom: 12,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={20}
                      color="#DC2626"
                      style={{ marginRight: 12 }}
                    />
                    <AppText
                      size={12}
                      style={{ color: "#DC2626", fontWeight: "600", flex: 1 }}
                    >
                      {routeError}
                    </AppText>
                  </View>
                )}

                {filteredServices.length === 0 ? (
                  <AppText
                    size={12}
                    style={{
                      color: colors.textSecondary,
                      textAlign: "center",
                      paddingVertical: 20,
                    }}
                  >
                    No services within 5km
                  </AppText>
                ) : (
                  <ScrollView
                    style={styles.servicesListContainer}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    removeClippedSubviews
                  >
                    {filteredServices.map((service) => (
                      <ServiceRow
                        key={service.id}
                        service={service}
                        textSecondary={colors.textSecondary}
                        bg={getPanelBgByWaitTime(service.waitTime)}
                        pinColor={getPinColorByWaitTime(service.waitTime)}
                        onPress={handleServiceCardPress}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  // Hero
  heroSection: { paddingHorizontal: 16, paddingTop: 18, marginBottom: 18 },
  greetingRow: { flexDirection: "row", alignItems: "flex-start" },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#D1FAE5",
    borderRadius: Radii.pill,
    marginTop: 6,
  },
  statusDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },

  // Action tiles
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 26,
  },
  actionTile: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 92,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  // Sections
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#10B981" },

  // News
  newsItemContainer: {
    width: NEWS_ITEM_WIDTH,
    height: 170,
    borderRadius: Radii.lg,
    marginRight: 12,
    overflow: "hidden",
    backgroundColor: "#0B1220",
  },
  newsImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  newsImageOverlay: { ...StyleSheet.absoluteFillObject },
  newsTagPill: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.3)",
    borderWidth: 1,
    borderRadius: Radii.pill,
  },
  newsContent: { position: "absolute", bottom: 14, left: 14, right: 14 },

  // Notice
  noticeContainer: {
    height: 130,
    borderRadius: Radii.lg,
    overflow: "hidden",
    backgroundColor: "#0B1220",
  },
  noticeImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  noticeOverlay: { ...StyleSheet.absoluteFillObject },
  noticeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#EF4444",
    borderRadius: Radii.pill,
  },
  noticeContent: { position: "absolute", bottom: 14, left: 14, right: 14 },

  // Queue
  queueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locateBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  queueContainer: {
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mapWrapper: { width: "100%" },
  mapClip: {
    width: "100%",
    height: 200,
    borderRadius: Radii.md,
    overflow: "hidden",
    marginBottom: 12,
  },
  nearbyServicesMap: { width: "100%", height: 200 },
  servicesListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  servicesListContainer: { height: 260, width: "100%", paddingHorizontal: 2 },

  // Service row
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: Radii.md,
    gap: 12,
  },
  servicePin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CFFAFE",
  },
  serviceInfo: { flex: 1 },
  distPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
    backgroundColor: "#CFFAFE",
  },
});
