import { AppText } from "@/components/common/AppText";
import { SearchBar } from "@/components/searchbar/search-bar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface QueueItem {
  id: string;
  department: string;
  waiting: number;
}

interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  color: string;
  route: string;
}

const getQueueData = (t: any): QueueItem[] => [
  {
    id: "1",
    department: t("jPJBaiJahi"),
    waiting: Math.floor(Math.random() * 20) + 1,
  },
  {
    id: "2",
    department: t("kpjpEpfPetaling"),
    waiting: Math.floor(Math.random() * 15) + 1,
  },
  {
    id: "3",
    department: t("lhdnCyberjaya"),
    waiting: Math.floor(Math.random() * 18) + 1,
  },
  {
    id: "4",
    department: t("jpnSelayangJaya"),
    waiting: Math.floor(Math.random() * 16) + 1,
  },
  {
    id: "5",
    department: t("klinikKesihatanBayan"),
    waiting: Math.floor(Math.random() * 12) + 1,
  },
];

const getServiceCategories = (t: any): ServiceCategory[] => [
  {
    id: "1",
    title: t("identityDocuments"),
    description: t("renewMyKad"),
    color: "#E3F2FD",
    route: "/service/identity-documents",
  },
  {
    id: "2",
    title: t("transportLicensing"),
    description: t("renewDrivingLicense"),
    color: "#FFF3E0",
    route: "/service/transport-licensing",
  },
  {
    id: "3",
    title: t("taxFinance"),
    description: t("incomeTax"),
    color: "#F3E5F5",
    route: "/service/tax-finance",
  },
  {
    id: "4",
    title: t("employmentBenefits"),
    description: t("epfSocso"),
    color: "#E8F5E9",
    route: "/service/employment-benefits",
  },
  {
    id: "5",
    title: t("healthcare"),
    description: t("clinicVisits"),
    color: "#FCE4EC",
    route: "/service/healthcare",
  },
];

export default function AppointmentPage() {
  const router = useRouter();
  const { colors, elderlyMode } = useAppContext();
  const { t } = useTranslation();
  const [queueList, setQueueList] = useState<QueueItem[]>(getQueueData(t));
  const [searchText, setSearchText] = useState<string>("");
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
  const serviceCategories = getServiceCategories(t);

  // Live queue updates every 1-3 seconds (random)
  useEffect(() => {
    const scheduleNextUpdate = () => {
      // Random interval between 1-3 seconds
      const randomInterval = Math.random() * 2000 + 1000;

      const timeout = setTimeout(() => {
        setQueueList((prevQueueList) => {
          // Randomly select which departments to update (1-3 departments)
          const numUpdates = Math.floor(Math.random() * 3) + 1;
          const indicesToUpdate = new Set<number>();
          const updatedIds = new Set<string>();

          // Pick random indices to update
          while (
            indicesToUpdate.size < numUpdates &&
            indicesToUpdate.size < prevQueueList.length
          ) {
            indicesToUpdate.add(
              Math.floor(Math.random() * prevQueueList.length),
            );
          }

          // Update selected departments
          const updated = prevQueueList.map((item, index) => {
            if (indicesToUpdate.has(index)) {
              updatedIds.add(item.id);
              // Randomly increase or decrease (±1 to ±3)
              const change =
                (Math.random() > 0.5 ? 1 : -1) *
                (Math.floor(Math.random() * 3) + 1);
              const newWaiting = Math.max(0, item.waiting + change);
              return { ...item, waiting: newWaiting };
            }
            return item;
          });

          // Add updated items to flashing set
          setFlashingIds(updatedIds);

          // Remove flash effect after 0.4 seconds for smoother animation
          setTimeout(() => {
            setFlashingIds(new Set());
          }, 400);

          return updated;
        });

        // Schedule next update
        scheduleNextUpdate();
      }, randomInterval);

      return timeout;
    };

    const timeoutId = scheduleNextUpdate();

    return () => clearTimeout(timeoutId);
  }, []);

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  const handleDocumentScan = () => {
    router.push("/service/scan" as any);
  };

  // Staggered section animations
  const titleAnim = useFadeInUp(stagger(0, 100));
  const searchAnim = useFadeInUp(stagger(1, 100));
  const quickAnim = useFadeInUp(stagger(2, 100));
  const scanAnim = useFadeInUp(stagger(3, 100));
  const queueAnim = useFadeInUp(stagger(4, 100));
  const categoryAnim = useFadeInUp(stagger(5, 100));

  const renderQueueItem = ({ item }: { item: QueueItem }) => {
    const isHighQueue = item.waiting > 15;
    const isCritical = item.waiting > 20;
    const statusColor = isCritical
      ? "#FF0000"
      : isHighQueue
        ? "#FF9800"
        : "#4CAF50";

    return (
      <TouchableOpacity
        style={[
          styles.queueItem,
          { backgroundColor: colors.backgroundGrouped },
        ]}
        activeOpacity={0.7}
      >
        <View style={styles.queueItemContent}>
          {/* Status Dot */}
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: statusColor,
                opacity: flashingIds.has(item.id) ? 0 : 1,
                transform: [{ scale: flashingIds.has(item.id) ? 0.5 : 1 }],
              },
            ]}
          />

          {/* Department Name */}
          <View style={styles.queueTextContent}>
            <AppText size={14} style={{ fontWeight: "700" }}>
              {item.department}
            </AppText>
          </View>

          {/* Queue Number & Status Badge */}
          <View style={styles.queueRightContent}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + "20" },
              ]}
            >
              <AppText
                size={13}
                style={{
                  fontWeight: "700",
                  color: statusColor,
                  opacity: flashingIds.has(item.id) ? 0 : 1,
                  transform: [{ scale: flashingIds.has(item.id) ? 0.5 : 1 }],
                }}
              >
                {item.waiting}
              </AppText>
              <AppText
                size={10}
                style={{
                  color: statusColor,
                  fontWeight: "600",
                  marginLeft: 4,
                }}
              >
                {t("waiting")}
              </AppText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderServiceCategory = ({ item }: { item: ServiceCategory }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: item.color }]}
      onPress={() => handleQuickAction(item.route)}
    >
      <View style={styles.categoryHeader}></View>
      <AppText
        size={14}
        style={{
          fontWeight: "700",
          marginBottom: vs(4),
          color: colors.textPrimary,
        }}
      >
        {item.title}
      </AppText>
      <AppText
        size={12}
        style={{
          color: colors.textSecondary,
          lineHeight: 16,
        }}
      >
        {item.description}
      </AppText>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <Animated.View style={[styles.titleSection, titleAnim]}>
          <AppText
            size={18}
            style={{
              fontWeight: "700",
              marginBottom: vs(4),
              color: colors.textPrimary,
            }}
          >
            {t("onlineQueuing")}
          </AppText>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={[styles.searchSection, searchAnim]}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder={t("search")}
          />
        </Animated.View>

        {/* Quick Access Buttons */}
        <Animated.View style={[styles.quickAccessContainer, quickAnim]}>
          <TouchableOpacity
            style={[styles.quickAccessButton, { backgroundColor: "#FF9800" }]}
            onPress={() => handleQuickAction("/service/pay-tax")}
          >
            <AppText
              size={12}
              style={{
                fontWeight: "700",
                color: "white",
                textAlign: "center",
              }}
            >
              {t("payTax")}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAccessButton, { backgroundColor: "#FFC107" }]}
            onPress={() => handleQuickAction("/service/renew-license")}
          >
            <AppText
              size={12}
              style={{
                fontWeight: "700",
                color: "white",
                textAlign: "center",
              }}
            >
              {t("renewLicense")}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAccessButton, { backgroundColor: "#2196F3" }]}
            onPress={() => handleQuickAction("/service/epf-withdrawal")}
          >
            <AppText
              size={12}
              style={{
                fontWeight: "700",
                color: "white",
                textAlign: "center",
              }}
            >
              {t("epfWithdrawal")}
            </AppText>
          </TouchableOpacity>
        </Animated.View>

        {/* Document Scanner Section */}
        <Animated.View style={[styles.section, scanAnim]}>
          <AppText
            size={16}
            style={{
              fontWeight: "700",
              marginBottom: vs(12),
              color: colors.textPrimary,
            }}
          >
            {t("scanDocument")}
          </AppText>
          <TouchableOpacity
            style={[
              styles.scanButton,
              { backgroundColor: colors.backgroundGrouped },
            ]}
            onPress={handleDocumentScan}
          >
            <IconSymbol
              size={32}
              name="doc.viewfinder"
              color={colors.primary}
            />
            <AppText
              size={14}
              style={{
                fontWeight: "700",
                color: colors.primary,
                marginTop: vs(8),
              }}
            >
              Scan now
            </AppText>
          </TouchableOpacity>
        </Animated.View>

        {/* Live Queue Status */}
        <Animated.View style={[styles.section, queueAnim]}>
          <View style={styles.sectionHeader}>
            <AppText
              size={16}
              style={{
                fontWeight: "700",
                color: colors.textPrimary,
              }}
            >
              Live Queue Status
            </AppText>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <AppText
                size={11}
                style={{
                  fontWeight: "600",
                  color: "#FF0000",
                }}
              >
                Live
              </AppText>
            </View>
          </View>

          {/* Status Legend */}
          <View style={styles.legendBar}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#4CAF50" }]}
              />
              <AppText size={11} style={{ color: colors.textSecondary }}>
                Low (0-15)
              </AppText>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#FF9800" }]}
              />
              <AppText size={11} style={{ color: colors.textSecondary }}>
                High (16-20)
              </AppText>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#FF0000" }]}
              />
              <AppText size={11} style={{ color: colors.textSecondary }}>
                Critical (20+)
              </AppText>
            </View>
          </View>

          <FlatList
            data={queueList}
            renderItem={renderQueueItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          />
        </Animated.View>

        {/* Take a Number Online Section */}
        <Animated.View style={[styles.section, categoryAnim]}>
          <AppText
            size={16}
            style={{
              fontWeight: "700",
              marginBottom: vs(12),
              color: colors.textPrimary,
            }}
          >
            Take a Number Online
          </AppText>
          <FlatList
            data={serviceCategories}
            renderItem={renderServiceCategory}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        </Animated.View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    paddingHorizontal: s(16),
    marginBottom: vs(12),
  },
  searchSection: {
    paddingHorizontal: s(16),
    marginBottom: vs(16),
  },
  quickAccessContainer: {
    flexDirection: "row",
    paddingHorizontal: s(16),
    gap: s(8),
    marginBottom: vs(24),
  },
  quickAccessButton: {
    flex: 1,
    paddingVertical: vs(12),
    paddingHorizontal: s(8),
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    paddingHorizontal: s(16),
    marginBottom: vs(24),
  },
  scanButton: {
    paddingVertical: vs(24),
    paddingHorizontal: s(16),
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  queueItem: {
    padding: s(14),
    borderRadius: 12,
    marginBottom: vs(8),
  },
  queueItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(12),
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  queueTextContent: {
    flex: 1,
  },
  queueRightContent: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statusBadge: {
    flexDirection: "row",
    paddingVertical: vs(6),
    paddingHorizontal: s(10),
    borderRadius: 6,
    minWidth: 85,
    alignItems: "center",
    justifyContent: "center",
  },
  queueInfo: {
    flex: 1,
  },
  categoryCard: {
    padding: s(12),
    borderRadius: 8,
    width: "100%",
  },
  categoryHeader: {
    marginBottom: vs(8),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: vs(12),
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(4),
    paddingVertical: vs(4),
    paddingHorizontal: s(8),
    backgroundColor: "#FF000015",
    borderRadius: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF0000",
  },
  legendBar: {
    flexDirection: "row",
    gap: s(16),
    paddingVertical: vs(12),
    paddingHorizontal: s(12),
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginBottom: vs(12),
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
