import { AppIcon } from "@/components/common/AppIcon";
import { AppText } from "@/components/common/AppText";
import { useAppContext } from "@/context/AppContext";
import { useFadeInUp, useFadeIn, useSlideInLeft, stagger } from "@/hooks/useAnimations";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface NotificationItem {
  id: string;
  type: "user" | "system" | "success" | "alert";
  userName?: string;
  message: string;
  isRead: boolean;
  time: string;
  avatarUrl?: string;
}

type TabType = "Today" | "This Week" | "Earlier";

// Animated notification card wrapper
function AnimatedNotifCard({ item, index, renderIcon, markAsRead, colors }: {
  item: NotificationItem;
  index: number;
  renderIcon: (item: NotificationItem) => React.ReactNode;
  markAsRead: (id: string) => void;
  colors: any;
}) {
  const anim = useSlideInLeft(index * 70, 400);

  return (
    <Animated.View style={anim}>
      <TouchableOpacity
        style={[styles.notificationCard, { backgroundColor: colors.background }]}
        onPress={() => markAsRead(item.id)}
      >
        {renderIcon(item)}
        <View style={styles.cardContent}>
          <AppText size={14} style={{ lineHeight: 20 }}>
            {item.userName ? (
              <AppText size={14} style={{ fontWeight: "700" }}>
                {item.userName}{" "}
              </AppText>
            ) : null}
            <AppText
              size={14}
              style={
                item.type === "system" || item.type === "success"
                  ? { fontWeight: "700" }
                  : {}
              }
            >
              {item.message}
            </AppText>
          </AppText>
          <AppText
            size={12}
            style={[styles.timeText, { color: colors.textSecondary }]}
          >
            {item.time}
          </AppText>
        </View>
        {!item.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: colors.error }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppContext();

  const [activeTab, setActiveTab] = useState<TabType>("Today");

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      type: "success",
      message: "Your MyKad renewal application has been approved",
      isRead: true,
      time: "Just now",
    },
    {
      id: "2",
      type: "alert",
      message: "Alert: Maintenance on government portal from 2 AM - 4 AM",
      isRead: false,
      time: "30m ago",
    },
    {
      id: "3",
      type: "system",
      message: "New driver's license batch processing available. Apply now.",
      isRead: false,
      time: "1h ago",
    },
    {
      id: "4",
      type: "success",
      message:
        "Your passport application status: Ready for collection at JPJ office",
      isRead: true,
      time: "2h ago",
    },
    {
      id: "5",
      type: "alert",
      message:
        "Road closure alert: Jalan Raja Chulan closed tomorrow 9 AM - 5 PM",
      isRead: false,
      time: "3h ago",
    },
    {
      id: "6",
      type: "system",
      message: "Reminder: Your vehicle road tax expires on 30 March 2026",
      isRead: false,
      time: "4h ago",
    },
  ]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif,
      ),
    );
  };

  const displayedNotifications = activeTab === "Today" ? notifications : [];

  // Header animation
  const headerAnim = useFadeIn(0, 300);
  const tabsAnim = useFadeInUp(150);

  const renderIcon = (item: NotificationItem) => {
    if (item.avatarUrl) {
      return <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />;
    }

    let iconName = "bell.fill";
    let bgColor = "#E0F7FA";
    let iconColor = "#00BCD4";

    if (item.type === "system") {
      iconName = "play.tv.fill";
      bgColor = "#E3F2FD";
      iconColor = "#03A9F4";
    } else if (item.type === "success") {
      iconName = "checkmark.seal.fill";
      bgColor = "#E8F5E9";
      iconColor = "#4CAF50";
    } else if (item.type === "alert") {
      iconName = "doc.plaintext.fill";
      bgColor = "#F3E5F5";
      iconColor = "#9C27B0";
    }

    return (
      <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
        <AppIcon name={iconName} size={20} color={iconColor} />
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.backgroundGrouped }]}
    >
      {/* Header with glow spotlight */}
      <Animated.View style={[styles.headerOuter, headerAnim]}>
        <LinearGradient
          colors={[
            colors.primary,
            colors.primary + "CC",
            colors.primary + "44",
            "transparent",
          ]}
          locations={[0, 0.45, 0.78, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ height: insets.top + 20 }} />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <AppIcon name="chevron.left" size={24} color="#FFF" />
          </TouchableOpacity>
          <AppText size={18} style={styles.headerTitle}>
            Notification
          </AppText>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <View style={styles.contentContainer}>
        {/* Toggle Tabs */}
        <Animated.View style={[styles.tabsContainer, tabsAnim]}>
          {(["Today", "This Week", "Earlier"] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabButton,
                  isActive && styles.tabButtonActive,
                  isActive && { backgroundColor: colors.background },
                ]}
              >
                <AppText
                  size={13}
                  style={[
                    styles.tabText,
                    { color: colors.textPlaceholder },
                    isActive && styles.tabTextActive,
                    isActive && { color: colors.textPrimary },
                  ]}
                >
                  {tab === "Today" ? `Today (${notifications.length})` : tab}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        <FlatList
          data={displayedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedNotifCard
              item={item}
              index={index}
              renderIcon={renderIcon}
              markAsRead={markAsRead}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyBellContainer}>
                <Image
                  source={require("../../assets/images/no-notification.png")}
                  style={{ width: 100, height: 100, resizeMode: "contain" }}
                />
              </View>
              <AppText size={16} style={styles.emptyTitle}>
                You're all caught up
              </AppText>
              <AppText size={14} style={styles.emptySubtitle}>
                All notifications will be displayed here
              </AppText>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerOuter: {
    overflow: "visible",
    paddingBottom: 40,
    marginBottom: -16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 1,
  },
  headerTitle: {
    color: "#FFF",
    fontWeight: "700",
  },
  backButton: {
    padding: 8,
    width: 40,
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    marginTop: -10,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  tabButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontWeight: "600",
  },
  tabTextActive: {},
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    paddingRight: 8,
    justifyContent: "center",
  },
  timeText: {
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Dimensions.get("window").height * 0.2,
  },
  emptyBellContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontWeight: "700",
    marginBottom: 8,
    color: "#1C1C1E",
  },
  emptySubtitle: {
    color: "#8E8E93",
  },
});
