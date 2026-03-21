import { AppText } from "@/components/common/AppText";
import { SearchBar } from "@/components/searchbar/search-bar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

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
  // icon: string;
  color: string;
  route: string;
}

const queueData: QueueItem[] = [
  { id: "1", department: "JPJ Balai Jahi", waiting: 12 },
  { id: "2", department: "KPJP EPF Petaling", waiting: 4 },
  { id: "3", department: "LHDN Cyberjaya", waiting: 8 },
  { id: "4", department: "JPN Selayang Jaya", waiting: 7 },
  { id: "5", department: "Klinik Kesihatan Bayan Baru", waiting: 3 },
];

const serviceCategories: ServiceCategory[] = [
  {
    id: "1",
    title: "Identity & Personal Documents",
    description: "Renew MyKad, birth cert, passport",
    // icon: "doc.text",
    color: "#E3F2FD",
    route: "/service/identity-documents",
  },
  {
    id: "2",
    title: "Transport & Licensing",
    description: "Renew driving license, pay road tax",
    // icon: "car.fill",
    color: "#FFF3E0",
    route: "/service/transport-licensing",
  },
  {
    id: "3",
    title: "Tax & Finance",
    description: "Income tax, payments, refunds",
    // icon: "dollarsign.circle.fill",
    color: "#F3E5F5",
    route: "/service/tax-finance",
  },
  {
    id: "4",
    title: "Employment & Benefits",
    description: "EPF, SOCSO, claims, employee matters",
    // icon: "briefcase.fill",
    color: "#E8F5E9",
    route: "/service/employment-benefits",
  },
  {
    id: "5",
    title: "Healthcare",
    description: "Clinic visits, appointments",
    // icon: "heart.fill",
    color: "#FCE4EC",
    route: "/service/healthcare",
  },
];

export default function AppointmentPage() {
  const router = useRouter();
  const { colors, elderlyMode } = useAppContext();
  const [queueList] = useState<QueueItem[]>(queueData);
  const [searchText, setSearchText] = useState<string>("");

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  const handleDocumentScan = () => {
    router.push("/service/scan" as any);
  };

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
        {item.waiting} waiting
      </AppText>
    </View>
  );

  const renderServiceCategory = ({ item }: { item: ServiceCategory }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: item.color }]}
      onPress={() => handleQuickAction(item.route)}
    >
      <View style={styles.categoryHeader}>
        {/* <IconSymbol size={24} name={item.icon as any} color={colors.primary} /> */}
      </View>
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
        <View style={styles.titleSection}>
          <AppText
            size={18}
            style={{
              fontWeight: "700",
              marginBottom: vs(4),
              color: colors.textPrimary,
            }}
          >
            Online Queue & Appointments
          </AppText>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search services..."
          />
        </View>

        {/* Quick Access Buttons */}
        <View style={styles.quickAccessContainer}>
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
              Pay Tax
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
              Renew License
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
              EPF Withdrawal
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Document Scanner Section */}
        <View style={styles.section}>
          <AppText
            size={16}
            style={{
              fontWeight: "700",
              marginBottom: vs(12),
              color: colors.textPrimary,
            }}
          >
            Document Scanner
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
        </View>

        {/* Live Queue Status */}
        <View style={styles.section}>
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
        </View>

        {/* Take a Number Online Section */}
        <View style={styles.section}>
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
        </View>
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
