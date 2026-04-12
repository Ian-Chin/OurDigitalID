import { AppIcon } from "@/components/common/AppIcon";
import { AppText } from "@/components/common/AppText";
import type { AppNotification } from "@/context/AppContext";
import { useAppContext } from "@/context/AppContext";
import { useFadeIn, useFadeInUp, useSlideInLeft } from "@/hooks/useAnimations";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

type TabType = "Today" | "This Week" | "Earlier";

// Animated notification card wrapper
function AnimatedNotifCard({
  item,
  index,
  renderIcon,
  markAsRead,
  colors,
}: {
  item: AppNotification;
  index: number;
  renderIcon: (item: AppNotification) => React.ReactNode;
  markAsRead: (id: string) => void;
  colors: any;
}) {
  const anim = useSlideInLeft(index * 70, 400);

  return (
    <Animated.View style={anim}>
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { backgroundColor: colors.background },
        ]}
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
  const { colors, notifications, markNotificationAsRead } = useAppContext();

  const [activeTab, setActiveTab] = useState<TabType>("Today");

  const displayedNotifications = activeTab === "Today" ? notifications : [];

  // Header animation
  const headerAnim = useFadeIn(0, 300);
  const tabsAnim = useFadeInUp(150);

  const renderIcon = (item: AppNotification) => {
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
              markAsRead={markNotificationAsRead}
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
                You are all caught up
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
