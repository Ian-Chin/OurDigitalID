import { AppText } from "@/components/common/AppText";
import { SearchBar } from "@/components/searchbar/search-bar";
import { vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Image mapping for news items
const newsImageMap: { [key: string]: any } = {
  "1": require("../../assets/images/mykasih.png"),
  "2": require("../../assets/images/id_illustration.png"),
};

// --- Fake Data Fetching ----

const fetchLatestNews = async () => {
  return new Promise<Array<{ id: string; title: string; blurb: string }>>(
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
  const insets = useSafeAreaInsets();
  const { colors, elderlyMode, userProfile } = useAppContext();
  const { t } = useTranslation();
  const userName = userProfile?.fullName || "";
  const [news, setNews] = useState<Array<any>>([]);
  const [displayNews, setDisplayNews] = useState<Array<any>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchLatestNews().then((data) => {
      setNews(data);
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

  useEffect(() => {
    if (displayNews.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % displayNews.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [displayNews.length]);

  const handleActionPress = (routePath: string) => {
    router.push(routePath as any);
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
            {t("welcome")}{userName ? `, ${userName}` : ""}!
          </AppText>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actionButtonsContainer, actionsAnim]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#FFF3E0" }]}
            onPress={() => handleActionPress("/online-queue")}
          >
            <AppText
              size={12}
              style={{
                color: "#FF9800",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {t("onlineQueuing")}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#F3E5F5" }]}
            onPress={() => handleActionPress("/scan")}
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

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#E8F5E9" }]}
            onPress={() => handleActionPress("/personal-info")}
          >
            <AppText
              size={12}
              style={{
                color: "#4CAF50",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {t("personalInfo")}
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
                Melacca - Alor Gajah
              </AppText>
            </View>
          </View>
        </Animated.View>

        {/* Live Queue Status Section */}
        <Animated.View style={[styles.section, queueAnim]}>
          <AppText
            size={16}
            style={{ fontWeight: "700", marginBottom: vs(12) }}
          >
            {t("liveQueue")}
          </AppText>
          <View style={styles.queueContainer}>
            <AppText
              size={12}
              style={{ color: colors.textSecondary, textAlign: "center" }}
            >
              {t("queuePlaceholder")}
            </AppText>
          </View>
        </Animated.View>

        <View style={{ height: 20 }} />
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
    padding: 16,
    alignItems: "center",
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
