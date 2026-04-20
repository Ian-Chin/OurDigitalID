import { AppText } from "@/components/common/AppText";
import { SearchBar } from "@/components/searchbar/search-bar";
import { vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { getDistance } from "geolib";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

// Conditionally import MapView only on native platforms
let MapView: any;
let Marker: any;
if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
}

const { width } = Dimensions.get("window");

// Image mapping for news items
const newsImageMap: { [key: string]: any } = {
  "1": require("../../assets/images/mykasih.png"),
  "2": require("../../assets/images/id_illustration.png"),
};

// Nearby service locations (sample data)
interface Service {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  waitTime?: number;
  distance?: number;
}

const nearbyServices: Service[] = [
  // Bukit Jalil Area (IDs 1-10)
  {
    id: "1",
    name: "JPJ Office - Bukit Jalil",
    latitude: 3.0485,
    longitude: 101.5605,
    type: "Transport & Licensing",
    waitTime: 35,
  },
  {
    id: "2",
    name: "Healthcare Clinic - Bukit Jalil",
    latitude: 3.0515,
    longitude: 101.555,
    type: "Healthcare",
    waitTime: 15,
  },
  {
    id: "3",
    name: "Tax Service Center - Bukit Jalil",
    latitude: 3.055868,
    longitude: 101.692481,
    type: "Tax & Finance",
    waitTime: 25,
  },
  {
    id: "4",
    name: "EPF Office - Bukit Jalil",
    latitude: 3.124267,
    longitude: 101.614787,
    type: "Employment Benefits",
    waitTime: 30,
  },
  {
    id: "5",
    name: "Immigration Center - Bukit Jalil",
    latitude: 3.045,
    longitude: 101.572,
    type: "Identity Documents",
    waitTime: 40,
  },
  {
    id: "6",
    name: "Digital Services - Bukit Jalil",
    latitude: 3.059269,
    longitude: 101.671787,
    type: "Identity Documents",
    waitTime: 15,
  },
  {
    id: "7",
    name: "Medical Center - Bukit Jalil",
    latitude: 3.049,
    longitude: 101.559,
    type: "Healthcare",
    waitTime: 12,
  },
  {
    id: "8",
    name: "License Renewal - Bukit Jalil",
    latitude: 3.053743,
    longitude: 101.670194,
    type: "Transport & Licensing",
    waitTime: 28,
  },
  {
    id: "9",
    name: "Document Center - Bukit Jalil",
    latitude: 3.05536,
    longitude: 101.695729,
    type: "Identity Documents",
    waitTime: 18,
  },
  {
    id: "10",
    name: "Health Services - Bukit Jalil",
    latitude: 3.0495,
    longitude: 101.566,
    type: "Healthcare",
    waitTime: 14,
  },

  // Petaling Jaya Area (IDs 11-19)
  {
    id: "11",
    name: "License Renewal Center - Petaling Jaya",
    latitude: 3.123506,
    longitude: 101.615624,
    type: "Transport & Licensing",
    waitTime: 28,
  },
  {
    id: "12",
    name: "Healthcare Hospital - Petaling Jaya",
    latitude: 3.068,
    longitude: 101.552,
    type: "Healthcare",
    waitTime: 22,
  },
  {
    id: "13",
    name: "KWSP EPF Branch - Petaling Jaya",
    latitude: 3.130142,
    longitude: 101.637664,
    type: "Employment Benefits",
    waitTime: 32,
  },
  {
    id: "14",
    name: "Document Processing - Petaling Jaya",
    latitude: 3.059,
    longitude: 101.575,
    type: "Identity Documents",
    waitTime: 20,
  },
  {
    id: "15",
    name: "Tax Office - Petaling Jaya",
    latitude: 3.07,
    longitude: 101.565,
    type: "Tax & Finance",
    waitTime: 18,
  },
  {
    id: "16",
    name: "Transport Services - Petaling Jaya",
    latitude: 3.096439,
    longitude: 101.555,
    type: "Transport & Licensing",
    waitTime: 26,
  },
  {
    id: "17",
    name: "Medical Clinic - Petaling Jaya",
    latitude: 3.116651,
    longitude: 101.548,
    type: "Healthcare",
    waitTime: 16,
  },
  {
    id: "18",
    name: "EPF Information - Petaling Jaya",
    latitude: 3.0635,
    longitude: 101.562,
    type: "Employment Benefits",
    waitTime: 28,
  },
  {
    id: "19",
    name: "ID Services - Petaling Jaya",
    latitude: 3.0705,
    longitude: 101.555,
    type: "Identity Documents",
    waitTime: 24,
  },

  // APU & Surrounding Area (IDs 20-22)
  {
    id: "20",
    name: "APU Campus Clinic",
    latitude: 3.053,
    longitude: 101.566,
    type: "Healthcare",
    waitTime: 10,
  },
  {
    id: "21",
    name: "Transport Services - APU Area",
    latitude: 3.055,
    longitude: 101.568,
    type: "Transport & Licensing",
    waitTime: 22,
  },
  {
    id: "22",
    name: "Document Center - APU",
    latitude: 3.051,
    longitude: 101.564,
    type: "Identity Documents",
    waitTime: 18,
  },

  // KL City Area (IDs 23-35)
  {
    id: "23",
    name: "JPJ Main Office - KL City",
    latitude: 3.139,
    longitude: 101.6869,
    type: "Transport & Licensing",
    waitTime: 45,
  },
  {
    id: "24",
    name: "Immigration Department - KL",
    latitude: 3.145,
    longitude: 101.692,
    type: "Identity Documents",
    waitTime: 50,
  },
  {
    id: "25",
    name: "Healthcare Hospital - Sentosa",
    latitude: 3.132,
    longitude: 101.675,
    type: "Healthcare",
    waitTime: 20,
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
    id: "28",
    name: "Medical Center - Bangsar",
    latitude: 3.093,
    longitude: 101.689,
    type: "Healthcare",
    waitTime: 18,
  },
  {
    id: "29",
    name: "Document Processing - KL",
    latitude: 3.142,
    longitude: 101.688,
    type: "Identity Documents",
    waitTime: 25,
  },
  {
    id: "30",
    name: "Licensing Center - Cheras",
    latitude: 3.065,
    longitude: 101.715,
    type: "Transport & Licensing",
    waitTime: 28,
  },
  {
    id: "31",
    name: "Healthcare Clinic - KLCC",
    latitude: 3.159,
    longitude: 101.71,
    type: "Healthcare",
    waitTime: 16,
  },
  {
    id: "32",
    name: "Financial Services - Merdeka",
    latitude: 3.123,
    longitude: 101.695,
    type: "Tax & Finance",
    waitTime: 22,
  },
  {
    id: "33",
    name: "EPF Branch - Wangsa Maju",
    latitude: 3.175,
    longitude: 101.72,
    type: "Employment Benefits",
    waitTime: 32,
  },
  {
    id: "34",
    name: "Medical Facility - Taman Desa",
    latitude: 3.085,
    longitude: 101.695,
    type: "Healthcare",
    waitTime: 19,
  },
  {
    id: "35",
    name: "Transport Services - Midvalley",
    latitude: 3.0782,
    longitude: 101.66,
    type: "Transport & Licensing",
    waitTime: 27,
  },
  {
    id: "36",
    name: "License Renewal - Intisari",
    latitude: 3.095,
    longitude: 101.7,
    type: "Transport & Licensing",
    waitTime: 26,
  },
  {
    id: "37",
    name: "ID Center - Bukit Bintang",
    latitude: 3.144,
    longitude: 101.712,
    type: "Identity Documents",
    waitTime: 28,
  },
];

// --- Fake Data Fetching ----

const fetchLatestNews = async () => {
  return new Promise<{ id: string; title: string; blurb: string }[]>(
    (resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "1",
            title: "My Kasih 2026",
            blurb: "Sumbangan Asas Rahmah. Review your benefits here.",
          },
          {
            id: "2",
            title: "New Digital ID Features",
            blurb:
              "Experience faster logins and secure transactions across government services.",
          },
        ]);
      }, 1500);
    },
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors, userProfile } = useAppContext();
  const { t } = useTranslation();
  const userName = userProfile?.fullName || "";
  const [displayNews, setDisplayNews] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const mapViewRef = useRef<any>(null);
  const currentIndexRef = useRef(0);

  // Request user location
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
    fetchLatestNews().then((data) => {
      const loopedData = Array(500)
        .fill(data)
        .flat()
        .map((item, index) => ({
          ...item,
          uniqueKey: `${item.id}-${index}`,
        }));
      setDisplayNews(loopedData);
    });
  }, []);

  // Filter services by proximity to user location (within 5km radius)
  useMemo(() => {
    if (!userLocation) {
      setFilteredServices([]);
      return;
    }

    const PROXIMITY_RADIUS_KM = 5;

    const servicesWithDistance = nearbyServices
      .map((service) => {
        const distanceInMeters = getDistance(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          { latitude: service.latitude, longitude: service.longitude },
        );
        const distanceInKm = distanceInMeters / 1000;

        return {
          ...service,
          distance: distanceInKm,
        };
      })
      .filter((service) => service.distance! <= PROXIMITY_RADIUS_KM)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    setFilteredServices(servicesWithDistance);
  }, [userLocation]);

  useEffect(() => {
    if (displayNews.length === 0) return;

    const interval = setInterval(() => {
      currentIndexRef.current =
        (currentIndexRef.current + 1) % displayNews.length;
      flatListRef.current?.scrollToIndex({
        index: currentIndexRef.current,
        animated: true,
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [displayNews.length]);

  const handleActionPress = (routePath: string) => {
    router.push(routePath as any);
  };

  const handleServiceCardPress = (service: Service) => {
    if (mapViewRef.current && Platform.OS !== "web") {
      mapViewRef.current.animateToRegion(
        {
          latitude: service.latitude,
          longitude: service.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000,
      );
    }
  };

  const handleCenterMap = () => {
    if (mapViewRef.current && userLocation && Platform.OS !== "web") {
      mapViewRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        1000,
      );
    }
  };

  // Section entrance animations
  const welcomeAnim = useFadeInUp(stagger(0, 120));
  const actionsAnim = useFadeInUp(stagger(1, 120));
  const newsAnim = useFadeInUp(stagger(2, 120));
  const noticeAnim = useFadeInUp(stagger(3, 120));
  const queueAnim = useFadeInUp(stagger(4, 120));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <Animated.View style={[styles.welcomeSection, welcomeAnim]}>
          <AppText
            size={18}
            style={{ fontWeight: "600", marginBottom: vs(12) }}
          >
            {t("welcome")}
            {userName ? `, ${userName}` : ""}!
          </AppText>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actionButtonsContainer, actionsAnim]}>
          {/* GIS */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#FFF3E0" }]}
            onPress={() => handleActionPress("/gis/gis")}
          >
            <AppText
              size={12}
              style={{
                color: "#FF9800",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {t("GIS")}
            </AppText>
          </TouchableOpacity>

          {/* Scan Document */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#F3E5F5" }]}
            onPress={() => handleActionPress("/service/scan")}
          >
            <AppText
              size={12}
              style={{
                color: "#9C27B0",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {t("scanDocument")}
            </AppText>
          </TouchableOpacity>

          {/* Report — replaces Personal Info */}
          <TouchableOpacity
            style={[styles.actionButton, styles.reportButton]}
            onPress={() => handleActionPress("/home/Report")}
          >
            <AppText
              size={12}
              style={{
                color: "#C62828",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {t("Report")}
            </AppText>
          </TouchableOpacity>
        </Animated.View>

        {/* Latest News Section */}
        <Animated.View style={[styles.section, newsAnim]}>
          <AppText
            size={16}
            style={{ fontWeight: "700", marginBottom: vs(12) }}
          >
            {t("latestNews")}
          </AppText>
          <View style={styles.newsContainer}>
            {displayNews.length === 0 ? (
              <AppText size={14}>{t("loadingNews")}</AppText>
            ) : (
              <FlatList
                ref={flatListRef}
                data={displayNews}
                keyExtractor={(item) => item.uniqueKey}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.newsItemContainer,
                      { backgroundColor: colors.backgroundGrouped },
                    ]}
                  >
                    <Image
                      source={newsImageMap[item.id]}
                      style={styles.newsImagePlaceholder}
                      resizeMode="cover"
                    />
                    <View style={styles.newsContent}>
                      <AppText
                        size={16}
                        style={{ fontWeight: "700", marginBottom: vs(4) }}
                      >
                        {item.title}
                      </AppText>
                      <AppText
                        size={12}
                        style={{ color: colors.textSecondary }}
                        numberOfLines={2}
                      >
                        {item.blurb}
                      </AppText>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </Animated.View>

        {/* Important Notice Section */}
        <Animated.View style={[styles.section, noticeAnim]}>
          <AppText
            size={16}
            style={{ fontWeight: "700", marginBottom: vs(12) }}
          >
            {t("importantNotice")}
          </AppText>
          {/* Tapping the flood alert pre-fills the report as a disaster report */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleActionPress("/home/report?type=disaster")}
          >
            <View
              style={[
                styles.noticeContainer,
                { backgroundColor: colors.backgroundGrouped },
              ]}
            >
              <Image
                source={require("../../assets/images/weather.jpg")}
                style={styles.noticeImage}
                resizeMode="cover"
              />
              <View style={styles.noticeContent}>
                <AppText
                  size={16}
                  style={{ fontWeight: "600", marginBottom: vs(4) }}
                >
                  Flood alert
                </AppText>
                <AppText size={12} style={{ color: colors.textSecondary }}>
                  Melaka - Alor Gajah
                </AppText>
                <AppText
                  size={11}
                  style={{ color: "#1565C0", marginTop: vs(4) }}
                >
                  Tap to submit a disaster report →
                </AppText>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Live Queue Status Section */}
        <Animated.View style={[styles.section, queueAnim]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: vs(12),
            }}
          >
            <AppText size={16} style={{ fontWeight: "700" }}>
              {t("liveQueue")}
            </AppText>
            <TouchableOpacity
              onPress={handleCenterMap}
              disabled={!userLocation || Platform.OS === "web"}
              style={{
                padding: 8,
                opacity: !userLocation || Platform.OS === "web" ? 0.5 : 1,
              }}
            >
              <Ionicons name="locate" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View
            style={[
              styles.queueContainer,
              { backgroundColor: colors.backgroundGrouped },
            ]}
          >
            {locationError ? (
              <AppText
                size={12}
                style={{ color: colors.textSecondary, textAlign: "center" }}
              >
                {locationError}
              </AppText>
            ) : !userLocation ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : Platform.OS === "web" ? (
              <AppText
                size={12}
                style={{ color: colors.textSecondary, textAlign: "center" }}
              >
                Map view not available on web
              </AppText>
            ) : (
              <View style={styles.mapWrapper}>
                <MapView
                  ref={mapViewRef}
                  style={styles.nearbyServicesMap}
                  initialRegion={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                  }}
                >
                  {/* User location marker */}
                  <Marker
                    coordinate={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                    }}
                    title="Your Location"
                    pinColor="#4CAF50"
                  />
                  {/* Service location markers */}
                  {nearbyServices.map((service) => (
                    <Marker
                      key={service.id}
                      coordinate={{
                        latitude: service.latitude,
                        longitude: service.longitude,
                      }}
                      title={service.name}
                      description={`${service.type}`}
                      pinColor="#FF9800"
                    />
                  ))}
                </MapView>

                {/* Services list below map */}
                <AppText
                  size={14}
                  style={{ fontWeight: "600", marginBottom: vs(8) }}
                >
                  Nearby Services ({filteredServices.length})
                </AppText>
                {filteredServices.length === 0 ? (
                  <AppText
                    size={12}
                    style={{
                      color: colors.textSecondary,
                      textAlign: "center",
                      paddingVertical: 16,
                    }}
                  >
                    No services within 5km
                  </AppText>
                ) : (
                  <ScrollView
                    style={styles.servicesListContainer}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {filteredServices.map((service) => (
                      <TouchableOpacity
                        key={service.id}
                        style={[
                          styles.serviceCard,
                          { backgroundColor: colors.background },
                        ]}
                        onPress={() => handleServiceCardPress(service)}
                      >
                        <View style={styles.serviceInfo}>
                          <AppText
                            size={13}
                            style={{ fontWeight: "600", marginBottom: 4 }}
                          >
                            {service.name}
                          </AppText>
                          <AppText
                            size={11}
                            style={{ color: colors.textSecondary }}
                          >
                            {service.type}
                          </AppText>
                        </View>
                        <View style={{ alignItems: "flex-end", gap: 4 }}>
                          <AppText
                            size={12}
                            style={{
                              fontWeight: "600",
                              color: "#2196F3",
                            }}
                          >
                            {service.distance?.toFixed(1)}km
                          </AppText>
                          <AppText
                            size={11}
                            style={{
                              fontWeight: "500",
                              color: "#FF9800",
                            }}
                          >
                            ~{service.waitTime}m wait
                          </AppText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1, paddingBottom: 80 },
  welcomeSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  // ── Report button styles ──────────────────────────────────────────────────
  reportButton: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    position: "relative",
  },
  reportBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#F44336",
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  // ─────────────────────────────────────────────────────────────────────────
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  newsContainer: { flexDirection: "row" },
  newsItemContainer: {
    width: width - 32,
    flexDirection: "row",
    borderRadius: 8,
    marginRight: 16,
    overflow: "hidden",
    height: 150,
  },
  newsImagePlaceholder: {
    width: 220,
    height: 150,
    backgroundColor: "#D0D0D0",
  },
  newsContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  noticeContainer: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
  },
  noticeImage: {
    width: 220,
    height: 150,
    backgroundColor: "#D0D0D0",
  },
  noticeContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  queueContainer: {
    backgroundColor: "#FFFDE7",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    width: "100%",
  },
  mapWrapper: {
    width: "100%",
    backgroundColor: "transparent",
  },
  nearbyServicesMap: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  servicesListContainer: {
    height: 280,
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  serviceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  serviceInfo: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: "center",
  },
  modalPlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    marginBottom: 16,
  },
  cancelButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    alignItems: "center",
  },
});
