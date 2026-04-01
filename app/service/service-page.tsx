import { AppText } from "@/components/common/AppText";
import { SearchBar } from "@/components/searchbar/search-bar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { useRouter } from "expo-router";
import { useState } from "react";
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
  { id: "1", department: t("jPJBaiJahi"), waiting: 12 },
  { id: "2", department: t("kpjpEpfPetaling"), waiting: 4 },
  { id: "3", department: t("lhdnCyberjaya"), waiting: 8 },
  { id: "4", department: t("jpnSelayangJaya"), waiting: 7 },
  { id: "5", department: t("klinikKesihatanBayan"), waiting: 3 },
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
  const [queueList] = useState<QueueItem[]>(getQueueData(t));
  const [searchText, setSearchText] = useState<string>("");
  const serviceCategories = getServiceCategories(t);

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

  const renderQueueItem = ({ item }: { item: QueueItem }) => (
    <View
      style={[styles.queueItem, { backgroundColor: colors.backgroundGrouped }]}
    >
      <View style={styles.queueInfo}>
        <AppText size={14} style={{ fontWeight: "600" }}>
          {item.department}
        </AppText>
      </View>
      <AppText size={14} style={{ fontWeight: "700", color: colors.primary }}>
        {item.waiting} {t("waiting")}
      </AppText>
    </View>
  );

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
          <AppText
            size={16}
            style={{
              fontWeight: "700",
              marginBottom: vs(12),
              color: colors.textPrimary,
            }}
          >
            Live Queue Status
          </AppText>
          <FlatList
            data={queueList}
            renderItem={renderQueueItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: vs(12),
    paddingHorizontal: s(12),
    borderRadius: 8,
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
});
