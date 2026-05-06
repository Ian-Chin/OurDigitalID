import { AppText } from "@/components/common/AppText";
import { SearchBar } from "@/components/searchbar/search-bar";
import { Elevation, Gradients, Radii } from "@/constants/colors";
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

import MapView, { Marker } from "@/components/platform/Map";

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

const NEARBY_SERVICES: Service[] = [
  { id: "1", name: "JPJ Office", latitude: 3.0485, longitude: 101.5605, type: "Transport & Licensing", waitTime: 35 },
  { id: "2", name: "Healthcare Clinic", latitude: 3.0515, longitude: 101.555, type: "Healthcare", waitTime: 15 },
  { id: "3", name: "Tax Service Center", latitude: 3.055868, longitude: 101.692481, type: "Tax & Finance", waitTime: 25 },
  { id: "4", name: "EPF Office", latitude: 4.55643, longitude: 101.614787, type: "Employment Benefits", waitTime: 30 },
  { id: "6", name: "Digital Services", latitude: 3.059269, longitude: 101.671787, type: "Identity Documents", waitTime: 15 },
  { id: "8", name: "License Renewal", latitude: 3.053743, longitude: 101.670194, type: "Transport & Licensing", waitTime: 28 },
  { id: "9", name: "Document Center", latitude: 3.05536, longitude: 101.695729, type: "Identity Documents", waitTime: 18 },
  { id: "11", name: "License Renewal Center", latitude: 3.123506, longitude: 101.615624, type: "Transport & Licensing", waitTime: 28 },
  { id: "13", name: "KWSP EPF Branch", latitude: 3.130142, longitude: 101.637664, type: "Employment Benefits", waitTime: 32 },
  { id: "14", name: "Document Processing", latitude: 4.557652, longitude: 101.0882, type: "Identity Documents", waitTime: 20 },
  { id: "15", name: "Tax Office", latitude: 3.07, longitude: 101.565, type: "Tax & Finance", waitTime: 18 },
  { id: "16", name: "Transport Services", latitude: 3.096439, longitude: 101.555, type: "Transport & Licensing", waitTime: 26 },
  { id: "17", name: "Medical Clinic", latitude: 3.116651, longitude: 101.548, type: "Healthcare", waitTime: 16 },
  { id: "18", name: "EPF Information", latitude: 3.0635, longitude: 101.562, type: "Employment Benefits", waitTime: 28 },
  { id: "19", name: "ID Services", latitude: 3.0705, longitude: 101.555, type: "Identity Documents", waitTime: 24 },
  { id: "20", name: "APU Campus Clinic", latitude: 3.053, longitude: 101.566, type: "Healthcare", waitTime: 10 },
  { id: "21", name: "Transport Services", latitude: 3.055, longitude: 101.568, type: "Transport & Licensing", waitTime: 22 },
  { id: "23", name: "JPJ Main Office", latitude: 3.139, longitude: 101.6869, type: "Transport & Licensing", waitTime: 45 },
  { id: "24", name: "Immigration Department", latitude: 3.145, longitude: 101.692, type: "Identity Documents", waitTime: 50 },
  { id: "25", name: "Healthcare Hospital", latitude: 3.132, longitude: 101.675, type: "Healthcare", waitTime: 20 },
  { id: "26", name: "EPF KL Main Office", latitude: 3.128, longitude: 101.68, type: "Employment Benefits", waitTime: 35 },
  { id: "27", name: "Tax Office - KL Central", latitude: 3.138, longitude: 101.685, type: "Tax & Finance", waitTime: 30 },
  { id: "32", name: "Financial Services", latitude: 3.123, longitude: 101.695, type: "Tax & Finance", waitTime: 22 },
  { id: "33", name: "EPF Branch - Wangsa Maju", latitude: 3.175, longitude: 101.72, type: "Employment Benefits", waitTime: 32 },
  { id: "34", name: "Medical Facility - Taman Desa", latitude: 3.085, longitude: 101.695, type: "Healthcare", waitTime: 19 },
  { id: "35", name: "Transport Services", latitude: 3.0782, longitude: 101.66, type: "Transport & Licensing", waitTime: 27 },
];

const NEWS_DATA = [
  { id: "1", title: "My Kasih 2026", blurb: "Sumbangan Asas Rahmah. Review your benefits here.", tag: "Benefits" },
  { id: "2", title: "New Digital ID Features", blurb: "Faster logins and secure transactions across government services.", tag: "Update" },
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
      <View style={[styles.actionIconWrap, { backgroundColor: "rgba(255,255,255,0.45)" }]}>
        <Ionicons name={icon} size={20} color={fg} />
      </View>
      <AppText
        size={12}
        style={{ color: fg, fontWeight: "700", marginTop: 8, letterSpacing: 0.2 }}
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
    onPress,
  }: {
    service: Service;
    textSecondary: string;
    bg: string;
    onPress: (s: Service) => void;
  }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.serviceCard, { backgroundColor: bg }]}
      onPress={() => onPress(service)}
    >
      <View style={styles.servicePin}>
        <Ionicons name="business" size={14} color="#06B6D4" />
      </View>
      <View style={styles.serviceInfo}>
        <AppText size={13} style={{ fontWeight: "700", marginBottom: 2 }}>
          {service.name}
        </AppText>
        <AppText size={11} style={{ color: textSecondary }} numberOfLines={1}>
          {service.type}
        </AppText>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <View style={styles.distPill}>
          <Ionicons name="navigate" size={10} color="#0891B2" />
          <AppText size={11} style={{ fontWeight: "700", color: "#0891B2", marginLeft: 3 }}>
            {service.distance?.toFixed(1)}km
          </AppText>
        </View>
        <AppText size={10} style={{ fontWeight: "600", color: "#D97706" }}>
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
    <View style={[styles.newsItemContainer, Elevation.sm, { shadowColor: "#0B1220" }]}>
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
        <AppText size={10} style={{ color: "#FFF", fontWeight: "700", letterSpacing: 0.4 }}>
          {item.tag}
        </AppText>
      </View>
      <View style={styles.newsContent}>
        <AppText size={15} style={{ fontWeight: "800", marginBottom: 4, color: "#FFF" }}>
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
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [locationError, setLocationError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const mapViewRef = useRef<any>(null);
  const currentIndexRef = useRef(0);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
      currentIndexRef.current = (currentIndexRef.current + 1) % NEWS_DATA.length;
      flatListRef.current?.scrollToOffset({
        offset: currentIndexRef.current * NEWS_ITEM_OFFSET,
        animated: true,
      });
    }, 4500);
    return () => {
      if (autoScrollIntervalRef.current) clearInterval(autoScrollIntervalRef.current);
    };
  }, []);

  const handleActionPress = useCallback(
    (route: string) => router.push(route as any),
    [router],
  );

  const handleServiceCardPress = useCallback((service: Service) => {
    mapViewRef.current?.animateToRegion(
      {
        latitude: service.latitude,
        longitude: service.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      900,
    );
  }, []);

  const handleCenterMap = useCallback(() => {
    const c = userLocation ?? FALLBACK_MAP_CENTER;
    mapViewRef.current?.animateToRegion(
      { latitude: c.latitude, longitude: c.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 },
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
              <AppText size={11} style={{ color: colors.success, fontWeight: "700" }}>
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
            <AppText size={16} style={{ fontWeight: "800", color: colors.textPrimary }}>
              {t("latestNews")}
            </AppText>
            <View style={styles.sectionHeaderRight}>
              <View style={styles.liveDot} />
              <AppText size={11} style={{ color: colors.success, fontWeight: "700" }}>
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
              const idx = Math.round(e.nativeEvent.contentOffset.x / NEWS_ITEM_OFFSET);
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
            style={{ fontWeight: "800", marginBottom: vs(12), color: colors.textPrimary }}
          >
            {t("importantNotice")}
          </AppText>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleActionPress("/home/report?type=disaster")}
          >
            <View style={[styles.noticeContainer, Elevation.sm, { shadowColor: "#0B1220" }]}>
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
                <AppText size={10} style={{ color: "#FFF", fontWeight: "800", marginLeft: 4 }}>
                  ALERT
                </AppText>
              </View>
              <View style={styles.noticeContent}>
                <AppText size={16} style={{ fontWeight: "800", color: "#FFF", marginBottom: 2 }}>
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
            <AppText size={12} style={{ color: colors.textSecondary, marginBottom: vs(8) }}>
              {locationError}. Showing fallback ordering.
            </AppText>
          ) : null}
          <View style={styles.queueHeader}>
            <View>
              <AppText size={16} style={{ fontWeight: "800", color: colors.textPrimary }}>
                {t("liveQueue")}
              </AppText>
              <AppText size={11} style={{ color: colors.textSecondary, marginTop: 2 }}>
                {filteredServices.length} centres within 5km
              </AppText>
            </View>
            <TouchableOpacity
              onPress={handleCenterMap}
              style={[styles.locateBtn, { backgroundColor: colors.primarySoft }]}
              hitSlop={8}
            >
              <Ionicons name="locate" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.queueContainer,
              { backgroundColor: colors.backgroundElevated, borderColor: colors.borderLight },
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
                      longitude: (userLocation ?? FALLBACK_MAP_CENTER).longitude,
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
                        pinColor="#10B981"
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
                        pinColor={HOME_SERVICE_MARKER_COLOR}
                      />
                    ))}
                  </MapView>
                </View>

                <View style={styles.servicesListHeader}>
                  <AppText size={13} style={{ fontWeight: "700", color: colors.textPrimary }}>
                    Nearby Services
                  </AppText>
                  <AppText size={11} style={{ color: colors.textSecondary }}>
                    Sorted by distance
                  </AppText>
                </View>

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
                        bg={colors.background}
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
  statusDotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981" },

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
  newsImagePlaceholder: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
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
  noticeImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
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
