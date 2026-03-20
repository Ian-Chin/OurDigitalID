import NavigationButton from "@/components/NavigationButton/navigation-button";
// import { ThemedText } from "@/components/\\themed-text";
// import { ThemedView } from "@/components/themed-view";
import { AppColors } from '@/constants/colors';
import { s, vs, fs } from '@/constants/layout';
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// --- Fake Data Fetching ----
const fetchUserData = async () => {
  return new Promise<{ name: string }>((resolve) => {
    setTimeout(() => resolve({ name: "John Doe" }), 1000);
  });
};

const fetchLatestNews = async () => {
  return new Promise<
    Array<{ id: string; title: string; image: string; blurb: string }>
  >((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "1",
          title: "My Kasih 2026",
          blurb: "Sumbangan Asas Rahmah. Review your benefits here.",
          image: "https://picsum.photos/seed/news1/600/300",
        },
        {
          id: "2",
          title: "New Digital ID Features",
          blurb:
            "Experience faster logins and secure transactions across government services.",
          image: "https://picsum.photos/seed/news2/600/300",
        },
      ]);
    }, 1500);
  });
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState<string>("Loading...");
  const [news, setNews] = useState<Array<any>>([]);
  const [displayNews, setDisplayNews] = useState<Array<any>>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchUserData().then((data) => setUserName(data.name));
    fetchLatestNews().then((data) => {
      setNews(data);
      // Duplicate the news list 500 times to simulate an infinite loop
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

  // Auto-scroll logic for Latest News
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/ourdigitalID.png")}
            style={{ width: 150, height: 40, resizeMode: "contain" }}
          />
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => console.log("Navigating to notifications...")}
          >
            <IconSymbol size={24} name="bell.fill" color="#333333" />
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome, {userName}!
          </Text>
          <View style={styles.searchContainer}>
            <IconSymbol size={20} name="magnifyingglass" color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#FFF3E0" }]}
            onPress={() => handleActionPress("/online-queue")}
          >
            <Text style={[styles.actionButtonText, { color: "#FF9800" }]}>
              Online Queuing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#F3E5F5" }]}
            onPress={() => handleActionPress("/scan")}
          >
            <Text style={[styles.actionButtonText, { color: "#9C27B0" }]}>
              Scan document
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#E8F5E9" }]}
            onPress={() => handleActionPress("/personal-info")}
          >
            <Text style={[styles.actionButtonText, { color: "#4CAF50" }]}>
              Personal info
            </Text>
          </TouchableOpacity>
        </View>

        {/* Latest News Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest News</Text>
          <View style={styles.newsContainer}>
            {displayNews.length === 0 ? (
              <Text>Loading news...</Text>
            ) : (
              <FlatList
                ref={flatListRef}
                data={displayNews}
                keyExtractor={(item) => item.uniqueKey}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.newsItemContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.newsImagePlaceholder}
                    />
                    <View style={styles.newsContent}>
                      <Text style={styles.newsTitle}>
                        {item.title}
                      </Text>
                      <Text style={styles.newsBlurb} numberOfLines={2}>
                        {item.blurb}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>

        {/* Important Notice Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Notice!</Text>
          <View style={styles.noticeContainer}>
            <View style={styles.noticeImage} />
            <View style={styles.noticeContent}>
              <Text style={styles.noticeTitle}>Flood alert</Text>
              <Text style={styles.noticeSubtitle}>
                Melacca - Alor Gajah
              </Text>
            </View>
          </View>
        </View>

        {/* Live Queue Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Queue Status</Text>
          <View style={styles.queueContainer}>
            <Text style={styles.queuePlaceholder}>
              Please enable location services to view the nearest department
              queue status
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Navigation Button */}
      <NavigationButton
      // onCenterPress={() => {
      //   console.log("Center button pressed");
      // }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22, // Makes it a perfect circle
    backgroundColor: "#E8E8E8", // Light gray background
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1565C0",
  },
  welcomeSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8E8E8",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    color: "#333",
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
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  newsContainer: {
    flexDirection: "row",
  },
  newsItemContainer: {
    width: width - 32,
    flexDirection: "row",
    backgroundColor: "#FDF5E6",
    borderRadius: 8,
    marginRight: 16,
    overflow: "hidden",
    height: 150,
  },
  newsImagePlaceholder: {
    width: 180,
    height: 150,
    backgroundColor: "#D0D0D0",
  },
  newsContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  newsBlurb: {
    fontSize: 12,
    color: "#555",
  },
  noticeContainer: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    overflow: "hidden",
  },
  noticeImage: {
    width: 180,
    height: 150,
    backgroundColor: "#D0D0D0",
  },
  noticeContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    backgroundColor: "#FFFDE7",
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  noticeSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  queueContainer: {
    backgroundColor: "#FFFDE7",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  queuePlaceholder: {
    fontSize: 12,
    textAlign: "center",
    color: "#666",
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
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
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
  modalText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
