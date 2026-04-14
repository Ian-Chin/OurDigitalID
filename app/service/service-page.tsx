import { AppText } from "@/components/common/AppText";
import { SearchBar } from "@/components/searchbar/search-bar";
import { s, vs } from "@/constants/layout";
import { useAppContext } from "@/context/AppContext";
import { stagger, useFadeInUp } from "@/hooks/useAnimations";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
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

interface ServiceCenter {
  id: string;
  name: string;
  category: string;
  location: string;
  distance: number; // in km
  waiting: number;
  hours: string;
}

interface ServiceCategory {
  id: string;
  title: string;
  description: string;
  color: string;
  route: string;
}

interface UserTicket {
  id: string;
  departmentId: string;
  departmentName: string;
  ticketNumber: number;
  timestamp: number;
  estimatedWaitTime: number;
}

// Map departments to service categories
const departmentCategoryMap: { [key: string]: string } = {
  "1": "transport",
  "2": "employment",
  "3": "tax",
  "4": "identity",
  "5": "healthcare",
};

const getNearbyServiceCenters = (): ServiceCenter[] => [
  // Identity Documents Services

  {
    id: "3",
    name: "Digital ID Center",
    category: "identity",
    location: "Mid Valley, Kuala Lumpur",
    distance: 4.1,
    waiting: Math.floor(Math.random() * 12) + 1,
    hours: "10:00 AM - 6:00 PM",
  },


  // Transport & Licensing Services
  {
    id: "7",
    name: "Transport Services - Bangsar",
    category: "transport",
    location: "Bangsar, Kuala Lumpur",
    distance: 4.5,
    waiting: Math.floor(Math.random() * 17) + 1,
    hours: "9:00 AM - 5:00 PM",
  },
  {
    id: "8",
    name: "Vehicle Licensing",
    category: "transport",
    location: "Mid Valley, Kuala Lumpur",
    distance: 6.2,
    waiting: Math.floor(Math.random() * 14) + 1,
    hours: "10:00 AM - 6:00 PM",
  },

  // Tax & Finance Services

  {
    id: "10",
    name: "Tax Office",
    category: "tax",
    location: "Sentosa, Kuala Lumpur",
    distance: 4.0,
    waiting: Math.floor(Math.random() * 16) + 1,
    hours: "9:00 AM - 5:00 PM",
  },

  // Employment Benefits Services
  {
    id: "15",
    name: "EPF Information",
    category: "employment",
    location: "Bangsar, Kuala Lumpur",
    distance: 4.7,
    waiting: Math.floor(Math.random() * 14) + 1,
    hours: "9:00 AM - 5:00 PM",
  },


  // Healthcare Services
  {
    id: "17",
    name: "Klinik Kesihatan Bayan",
    category: "healthcare",
    location: "Bayar Baru, Kuala Lumpur",
    distance: 2.1,
    waiting: Math.floor(Math.random() * 12) + 1,
    hours: "8:00 AM - 5:00 PM",
  },
  {
    id: "18",
    name: "Healthcare Clinic",
    category: "healthcare",
    location: "Petaling Jaya",
    distance: 3.3,
    waiting: Math.floor(Math.random() * 14) + 1,
    hours: "8:30 AM - 6:00 PM",
  },
  {
    id: "19",
    name: "Medical Center",
    category: "healthcare",
    location: "Bangsar, Kuala Lumpur",
    distance: 4.2,
    waiting: Math.floor(Math.random() * 11) + 1,
    hours: "9:00 AM - 5:30 PM",
  },

];

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
  const nearbyServices = getNearbyServiceCenters();

  // User's current ticket
  const [userTicket, setUserTicket] = useState<UserTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState<ServiceCenter | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [ticketCountdown, setTicketCountdown] = useState<number>(0);
  const [showServiceConfirmModal, setShowServiceConfirmModal] = useState(false);
  const ticketCountdownIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [nextTicketNumbers, setNextTicketNumbers] = useState<{
    [key: string]: number;
  }>(
    nearbyServices.reduce(
      (acc, item) => ({
        ...acc,
        [item.id]: Math.floor(Math.random() * 100) + 50,
      }),
      {},
    ),
  );

  // Trigger notification when user's turn (20 seconds countdown)
  const triggerTurnNotification = () => {
    // Visual notification has already been shown via modal
    // Sound would be played here if expo-av is available
    console.log("🔔 User's turn notification triggered!");
  };

  // Start countdown timer for ticket (20 seconds)
  const startTicketCountdown = () => {
    setTicketCountdown(20);

    if (ticketCountdownIntervalRef.current) {
      clearInterval(ticketCountdownIntervalRef.current);
    }

    let remainingTime = 20;
    ticketCountdownIntervalRef.current = setInterval(() => {
      remainingTime -= 1;
      setTicketCountdown(remainingTime);

      // Show modal when user's turn (countdown reaches 0)
      if (remainingTime === 0) {
        if (ticketCountdownIntervalRef.current) {
          clearInterval(ticketCountdownIntervalRef.current);
        }
        triggerTurnNotification();
        setShowServiceConfirmModal(true);
      }
    }, 1000) as any;
  };

  // Get filtered services based on category and search
  const getFilteredServices = (): ServiceCenter[] => {
    let filtered = nearbyServices;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (service) => service.category === selectedCategory,
      );
    }

    if (searchText.trim()) {
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(searchText.toLowerCase()) ||
          service.location.toLowerCase().includes(searchText.toLowerCase()),
      );
    }

    // Sort by distance
    return filtered.sort((a, b) => a.distance - b.distance);
  };

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

  // Take a number function
  const handleTakeNumber = (service: ServiceCenter) => {
    if (userTicket) {
      Alert.alert(
        "Active Ticket",
        "You already have an active ticket. Please leave your current queue first.",
      );
      return;
    }
    setSelectedDept(service);
    setShowTicketModal(true);
  };

  // Confirm take number
  const handleConfirmTakeNumber = () => {
    if (!selectedDept) return;

    const newTicketNumber = nextTicketNumbers[selectedDept.id] + 1;
    setNextTicketNumbers((prev) => ({
      ...prev,
      [selectedDept.id]: newTicketNumber,
    }));

    const ticket: UserTicket = {
      id: `ticket-${Date.now()}`,
      departmentId: selectedDept.id,
      departmentName: selectedDept.name,
      ticketNumber: newTicketNumber,
      timestamp: Date.now(),
      estimatedWaitTime:
        selectedDept.waiting * 4 + Math.floor(Math.random() * 10),
    };

    setUserTicket(ticket);
    setShowTicketModal(false);

    // Start countdown timer (20 seconds to simulate queue time)
    startTicketCountdown();

    Alert.alert(
      "Ticket Issued! ✅",
      `Your ticket number: ${ticket.ticketNumber}\n\nService Center: ${selectedDept.name}\nLocation: ${selectedDept.location}\nDistance: ${selectedDept.distance}km\n\nEstimated wait time: ~${ticket.estimatedWaitTime} minutes`,
    );
  };

  // Get user's queue position
  const getUserQueuePosition = (): number => {
    if (!userTicket || !selectedDept) return 0;
    return Math.max(1, selectedDept.waiting - Math.floor(Math.random() * 3));
  };

  // Cancel ticket
  const handleCancelTicket = () => {
    Alert.alert(
      "Leave Queue?",
      "Are you sure you want to cancel your ticket?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave Queue",
          onPress: () => {
            if (ticketCountdownIntervalRef.current) {
              clearInterval(ticketCountdownIntervalRef.current);
              ticketCountdownIntervalRef.current = undefined;
            }
            setUserTicket(null);
            setSelectedDept(null);
            setShowTicketModal(false);
            setTicketCountdown(0);
            Alert.alert("Ticket Cancelled", "You have left the queue.");
          },
          style: "destructive",
        },
      ],
    );
  };

  // Handle when user confirms they are at the counter
  const handleServiceContinued = () => {
    if (ticketCountdownIntervalRef.current) {
      clearInterval(ticketCountdownIntervalRef.current);
      ticketCountdownIntervalRef.current = undefined;
    }
    setShowServiceConfirmModal(false);
    Alert.alert(
      "Service Started ✅",
      "Please proceed to the counter. Your ticket will be cleared after service completion.",
      [
        {
          text: "OK",
          onPress: () => {
            setUserTicket(null);
            setSelectedDept(null);
            setTicketCountdown(0);
          },
        },
      ],
    );
  };

  // Handle when user denies they are ready (not nearby)
  const handleServiceNotReady = () => {
    if (ticketCountdownIntervalRef.current) {
      clearInterval(ticketCountdownIntervalRef.current);
      ticketCountdownIntervalRef.current = undefined;
    }
    setShowServiceConfirmModal(false);
    Alert.alert(
      "Ticket Deactivated",
      "Your ticket has been cancelled. You need to book a new ticket line to continue.",
      [
        {
          text: "OK",
          onPress: () => {
            setUserTicket(null);
            setSelectedDept(null);
            setTicketCountdown(0);
            Alert.alert(
              "Book New Ticket",
              "Please select a service and get a new ticket.",
            );
          },
        },
      ],
    );
  };

  // Staggered section animations
  const titleAnim = useFadeInUp(stagger(0, 100));
  const searchAnim = useFadeInUp(stagger(1, 100));
  const quickAnim = useFadeInUp(stagger(2, 100));
  const queueAnim = useFadeInUp(stagger(3, 100));
  const categoryAnim = useFadeInUp(stagger(4, 100));

  const renderServiceItem = ({ item }: { item: ServiceCenter }) => {
    const isHighQueue = item.waiting > 15;
    const isCritical = item.waiting > 20;
    const statusColor = isCritical
      ? "#FF0000"
      : isHighQueue
        ? "#FF9800"
        : "#4CAF50";
    const isUserQueue = userTicket?.departmentId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.serviceItem,
          {
            backgroundColor: isUserQueue
              ? statusColor + "20"
              : colors.backgroundGrouped,
            borderWidth: isUserQueue ? 2 : 0,
            borderColor: isUserQueue ? statusColor : "transparent",
          },
        ]}
        onPress={() => handleTakeNumber(item)}
        activeOpacity={0.7}
      >
        <View style={styles.serviceItemContent}>
          {/* Left Section - Info */}
          <View style={styles.serviceInfoSection}>
            <View style={styles.serviceNameRow}>
              <AppText size={14} style={{ fontWeight: "700", flex: 1 }}>
                {item.name}
              </AppText>
              {isUserQueue && (
                <View style={{ paddingLeft: s(8) }}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={statusColor}
                  />
                </View>
              )}
            </View>

            <View style={styles.serviceDetailsRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={colors.textSecondary}
              />
              <AppText
                size={11}
                style={{ color: colors.textSecondary, marginLeft: 4, flex: 1 }}
              >
                {item.location} • {item.distance}km
              </AppText>
            </View>

            <View style={styles.serviceDetailsRow}>
              <Ionicons
                name="time-outline"
                size={12}
                color={colors.textSecondary}
              />
              <AppText
                size={11}
                style={{ color: colors.textSecondary, marginLeft: 4 }}
              >
                {item.hours}
              </AppText>
            </View>

            {isUserQueue && userTicket && (
              <AppText
                size={11}
                style={{ color: statusColor, fontWeight: "600", marginTop: 4 }}
              >
                Your Ticket: #{userTicket.ticketNumber} • Position: #
                {getUserQueuePosition()}
              </AppText>
            )}
          </View>

          {/* Right Section - Status Badge */}
          <View style={styles.statusBadgeSection}>
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
                waiting
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

        {/* Take a Number Online Section */}
        <Animated.View style={[styles.section, categoryAnim]}>
          <View style={styles.sectionHeader}>
            <AppText
              size={16}
              style={{
                fontWeight: "700",
                color: colors.textPrimary,
              }}
            >
              Book Your Service
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

          {/* Category Filter Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: vs(16) }}
            contentContainerStyle={{ gap: s(8) }}
          >
            <TouchableOpacity
              style={[
                styles.categoryFilterButton,
                {
                  backgroundColor:
                    selectedCategory === "all"
                      ? colors.primary
                      : colors.backgroundGrouped,
                },
              ]}
              onPress={() => setSelectedCategory("all")}
            >
              <AppText
                size={12}
                style={{
                  fontWeight: "600",
                  color:
                    selectedCategory === "all" ? "white" : colors.textPrimary,
                }}
              >
                All Services
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryFilterButton,
                {
                  backgroundColor:
                    selectedCategory === "identity"
                      ? colors.primary
                      : colors.backgroundGrouped,
                },
              ]}
              onPress={() => setSelectedCategory("identity")}
            >
              <AppText
                size={12}
                style={{
                  fontWeight: "600",
                  color:
                    selectedCategory === "identity"
                      ? "white"
                      : colors.textPrimary,
                }}
              >
                Identity
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryFilterButton,
                {
                  backgroundColor:
                    selectedCategory === "transport"
                      ? colors.primary
                      : colors.backgroundGrouped,
                },
              ]}
              onPress={() => setSelectedCategory("transport")}
            >
              <AppText
                size={12}
                style={{
                  fontWeight: "600",
                  color:
                    selectedCategory === "transport"
                      ? "white"
                      : colors.textPrimary,
                }}
              >
                Transport
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryFilterButton,
                {
                  backgroundColor:
                    selectedCategory === "tax"
                      ? colors.primary
                      : colors.backgroundGrouped,
                },
              ]}
              onPress={() => setSelectedCategory("tax")}
            >
              <AppText
                size={12}
                style={{
                  fontWeight: "600",
                  color:
                    selectedCategory === "tax" ? "white" : colors.textPrimary,
                }}
              >
                Tax & Finance
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryFilterButton,
                {
                  backgroundColor:
                    selectedCategory === "employment"
                      ? colors.primary
                      : colors.backgroundGrouped,
                },
              ]}
              onPress={() => setSelectedCategory("employment")}
            >
              <AppText
                size={12}
                style={{
                  fontWeight: "600",
                  color:
                    selectedCategory === "employment"
                      ? "white"
                      : colors.textPrimary,
                }}
              >
                Employment
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryFilterButton,
                {
                  backgroundColor:
                    selectedCategory === "healthcare"
                      ? colors.primary
                      : colors.backgroundGrouped,
                },
              ]}
              onPress={() => setSelectedCategory("healthcare")}
            >
              <AppText
                size={12}
                style={{
                  fontWeight: "600",
                  color:
                    selectedCategory === "healthcare"
                      ? "white"
                      : colors.textPrimary,
                }}
              >
                Healthcare
              </AppText>
            </TouchableOpacity>
          </ScrollView>

          {/* Available Departments */}
          <AppText
            size={13}
            style={{
              color: colors.textSecondary,
              fontWeight: "600",
              marginBottom: vs(10),
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Available Service Centers nearby ({getFilteredServices().length})
          </AppText>

          {getFilteredServices().length === 0 ? (
            <AppText
              size={13}
              style={{
                color: colors.textSecondary,
                textAlign: "center",
                paddingVertical: vs(20),
              }}
            >
              No service centers found. Try adjusting your search.
            </AppText>
          ) : (
            <FlatList
              data={getFilteredServices()}
              renderItem={renderServiceItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
            />
          )}
        </Animated.View>

        {/* Active Ticket Section */}
        {userTicket && (
          <Animated.View style={[styles.section, queueAnim]}>
            <View style={[styles.ticketBannerInline, { backgroundColor: "#4CAF50" }]}>
              <View style={styles.ticketBannerContent}>
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <AppText size={12} style={{ color: "white", fontWeight: "600" }}>
                    ACTIVE TICKET
                  </AppText>
                  <AppText
                    size={16}
                    style={{ color: "white", fontWeight: "700", marginTop: 2 }}
                  >
                    #{userTicket.ticketNumber} • {userTicket.departmentName}
                  </AppText>
                  <AppText
                    size={11}
                    style={{ color: "rgba(255,255,255,0.8)", marginTop: 2 }}
                  >
                    Position: #{getUserQueuePosition()} • Wait: ~
                    {userTicket.estimatedWaitTime}min
                  </AppText>
                </View>
                <TouchableOpacity
                  onPress={handleCancelTicket}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Take Number Modal */}
      <Modal
        visible={showTicketModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowTicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <AppText
              size={18}
              style={{
                fontWeight: "700",
                color: colors.textPrimary,
                marginBottom: vs(12),
                textAlign: "center",
              }}
            >
              Take a Number
            </AppText>

            {selectedDept && (
              <>
                <AppText
                  size={16}
                  style={{
                    color: colors.textSecondary,
                    marginBottom: vs(16),
                    textAlign: "center",
                  }}
                >
                  {selectedDept.name}
                </AppText>

                <View
                  style={[
                    styles.modalInfoBox,
                    { backgroundColor: colors.backgroundGrouped },
                  ]}
                >
                  <AppText
                    size={12}
                    style={{ color: colors.textSecondary, marginBottom: 4 }}
                  >
                    Location
                  </AppText>
                  <AppText
                    size={14}
                    style={{ fontWeight: "600", color: colors.textPrimary }}
                  >
                    {selectedDept.location}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.modalInfoBox,
                    { backgroundColor: colors.backgroundGrouped },
                  ]}
                >
                  <AppText
                    size={12}
                    style={{ color: colors.textSecondary, marginBottom: 4 }}
                  >
                    Distance
                  </AppText>
                  <AppText
                    size={14}
                    style={{ fontWeight: "600", color: "#2196F3" }}
                  >
                    {selectedDept.distance}km away
                  </AppText>
                </View>

                <View
                  style={[
                    styles.modalInfoBox,
                    { backgroundColor: colors.backgroundGrouped },
                  ]}
                >
                  <AppText
                    size={12}
                    style={{ color: colors.textSecondary, marginBottom: 4 }}
                  >
                    Current Wait
                  </AppText>
                  <AppText
                    size={20}
                    style={{ fontWeight: "700", color: "#FF9800" }}
                  >
                    {selectedDept.waiting} people
                  </AppText>
                </View>

                <View
                  style={[
                    styles.modalInfoBox,
                    { backgroundColor: colors.backgroundGrouped },
                  ]}
                >
                  <AppText
                    size={12}
                    style={{ color: colors.textSecondary, marginBottom: 4 }}
                  >
                    Operating Hours
                  </AppText>
                  <AppText
                    size={14}
                    style={{ fontWeight: "600", color: colors.textPrimary }}
                  >
                    {selectedDept.hours}
                  </AppText>
                </View>

                <View
                  style={[
                    styles.modalInfoBox,
                    { backgroundColor: colors.backgroundGrouped },
                  ]}
                >
                  <AppText
                    size={12}
                    style={{ color: colors.textSecondary, marginBottom: 4 }}
                  >
                    Estimated Wait
                  </AppText>
                  <AppText
                    size={20}
                    style={{ fontWeight: "700", color: "#2196F3" }}
                  >
                    ~{selectedDept.waiting * 4 + 5} minutes
                  </AppText>
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.backgroundGrouped },
                ]}
                onPress={() => setShowTicketModal(false)}
              >
                <AppText
                  size={14}
                  style={{
                    fontWeight: "600",
                    color: colors.textPrimary,
                    textAlign: "center",
                  }}
                >
                  Cancel
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#4CAF50" }]}
                onPress={handleConfirmTakeNumber}
              >
                <AppText
                  size={14}
                  style={{
                    fontWeight: "600",
                    color: "white",
                    textAlign: "center",
                  }}
                >
                  Get Ticket
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Service Confirmation Modal - When user's turn comes */}
      <Modal
        visible={showServiceConfirmModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowServiceConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: "#FF6B6B",
                borderWidth: 3,
                borderColor: "#FF0000",
              },
            ]}
          >
            <View style={{ alignItems: "center", marginBottom: vs(12) }}>
              <Ionicons name="alert-circle" size={48} color="white" />
            </View>

            <AppText
              size={22}
              style={{
                fontWeight: "700",
                color: "white",
                marginBottom: vs(8),
                textAlign: "center",
              }}
            >
              🎉 IT'S YOUR TURN!
            </AppText>

            <AppText
              size={14}
              style={{
                color: "rgba(255,255,255,0.95)",
                marginBottom: vs(20),
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Your ticket #{userTicket?.ticketNumber} at {userTicket?.departmentName} is now being called.
            </AppText>

            <View
              style={[
                styles.modalInfoBox,
                { backgroundColor: "rgba(255,255,255,0.2)" },
              ]}
            >
              <AppText
                size={12}
                style={{ color: "rgba(255,255,255,0.8)", marginBottom: 4 }}
              >
                Status
              </AppText>
              <AppText
                size={18}
                style={{ fontWeight: "700", color: "white" }}
              >
                🔴 CALLED TO COUNTER
              </AppText>
            </View>

            <AppText
              size={13}
              style={{
                color: "rgba(255,255,255,0.9)",
                marginBottom: vs(20),
                textAlign: "center",
                fontStyle: "italic",
                marginTop: vs(12),
              }}
            >
              Are you at the service counter?
            </AppText>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: "rgba(255,255,255,0.9)" },
                ]}
                onPress={handleServiceNotReady}
              >
                <AppText
                  size={14}
                  style={{
                    fontWeight: "600",
                    color: "#FF6B6B",
                    textAlign: "center",
                  }}
                >
                  ❌ Not Yet
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: "white" },
                ]}
                onPress={handleServiceContinued}
              >
                <AppText
                  size={14}
                  style={{
                    fontWeight: "600",
                    color: "#4CAF50",
                    textAlign: "center",
                  }}
                >
                  ✅ Yes, I'm Here!
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  ticketBanner: {
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
  },
  ticketBannerInline: {
    paddingVertical: vs(16),
    paddingHorizontal: s(12),
    borderRadius: 12,
  },
  ticketBannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    borderRadius: 16,
    padding: s(20),
    maxWidth: 400,
  },
  modalInfoBox: {
    padding: s(12),
    borderRadius: 10,
    marginBottom: vs(12),
  },
  modalButtons: {
    flexDirection: "row",
    gap: s(12),
    marginTop: vs(20),
  },
  modalButton: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: 10,
    alignItems: "center",
  },
  categoryFilterButton: {
    paddingVertical: vs(8),
    paddingHorizontal: s(16),
    borderRadius: 20,
    justifyContent: "center",
  },
  serviceItem: {
    padding: s(12),
    borderRadius: 12,
    marginBottom: vs(8),
  },
  serviceItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: s(12),
  },
  serviceInfoSection: {
    flex: 1,
  },
  serviceNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(6),
  },
  serviceDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(4),
  },
  statusBadgeSection: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
});
