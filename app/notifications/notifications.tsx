import { AppIcon } from "@/components/common/AppIcon";
import { AppText } from "@/components/common/AppText";
import { Elevation, Gradients, Radii } from "@/constants/colors";
import type { ActiveAlert, AlertKind, AppNotification } from "@/context/AppContext";
import { formatRelativeTime, useAppContext } from "@/context/AppContext";
import { useFadeIn, useFadeInUp, useSlideInLeft } from "@/hooks/useAnimations";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { memo, useCallback, useMemo, useState } from "react";
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

const ICON_BY_TYPE: Record<
  string,
  { name: string; bg: string; fg: string }
> = {
  default: { name: "bell.fill", bg: "#CFFAFE", fg: "#0891B2" },
  system: { name: "play.tv.fill", bg: "#E0F2FE", fg: "#0284C7" },
  success: { name: "checkmark.seal.fill", bg: "#D1FAE5", fg: "#059669" },
  alert: { name: "doc.plaintext.fill", bg: "#FEF3C7", fg: "#B45309" },
  weather: { name: "cloud.rain.fill", bg: "#CFFAFE", fg: "#0891B2" },
  flood: { name: "cloud.rain.fill", bg: "#DBEAFE", fg: "#1D4ED8" },
  earthquake: { name: "waveform.path.ecg", bg: "#FEE2E2", fg: "#B91C1C" },
  queue: { name: "person.2.fill", bg: "#E0E7FF", fg: "#4338CA" },
  document: { name: "doc.text.fill", bg: "#FEF3C7", fg: "#B45309" },
};

const NotifCard = memo(
  ({
    item,
    index,
    markAsRead,
    colors,
  }: {
    item: AppNotification;
    index: number;
    markAsRead: (id: string) => void;
    colors: any;
  }) => {
    const anim = useSlideInLeft(index * 60, 380);
    const meta = ICON_BY_TYPE[item.type] || ICON_BY_TYPE.default;

    return (
      <Animated.View style={anim}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.notificationCard,
            {
              backgroundColor: colors.backgroundElevated,
              borderColor: colors.borderLight,
            },
            !item.isRead && { borderColor: colors.accent + "55" },
            Elevation.sm,
            { shadowColor: "#0B1220" },
          ]}
          onPress={() => markAsRead(item.id)}
        >
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
              <AppIcon name={meta.name} size={18} color={meta.fg} />
            </View>
          )}

          <View style={styles.cardContent}>
            <AppText size={14} style={{ lineHeight: 20, color: colors.textPrimary }}>
              {item.userName ? (
                <AppText size={14} style={{ fontWeight: "700" }}>
                  {item.userName}{" "}
                </AppText>
              ) : null}
              <AppText
                size={14}
                style={
                  item.type === "system" || item.type === "success"
                    ? { fontWeight: "600" }
                    : { color: colors.textSecondary }
                }
              >
                {item.message}
              </AppText>
            </AppText>
            <AppText
              size={11}
              style={{
                color: colors.textSecondary,
                marginTop: 6,
                letterSpacing: 0.3,
                fontWeight: "600",
              }}
            >
              {item.time}
            </AppText>
          </View>

          {!item.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, notifications, markNotificationAsRead, triggerAlert } =
    useAppContext();

  const SIMULATIONS: { kind: AlertKind; label: string; icon: string; alert: ActiveAlert }[] = [
    {
      kind: "flood",
      label: "Flood",
      icon: "cloud.rain.fill",
      alert: {
        kind: "flood",
        title: "Flood Alert Near You",
        body: "Sg. Klang has High flood chances and is 2.4km away. Move to higher ground.",
      },
    },
    {
      kind: "earthquake",
      label: "Earthquake",
      icon: "waveform.path.ecg",
      alert: {
        kind: "earthquake",
        title: "Earthquake Alert (M5.2)",
        body: "Magnitude 5.2 earthquake detected near Ranau, Sabah. Take precautions.",
      },
    },
    {
      kind: "weather",
      label: "Severe Weather",
      icon: "cloud.bolt.rain.fill",
      alert: {
        kind: "weather",
        title: "Severe Weather Warning",
        body: "Thunderstorm and strong winds expected in Kuala Lumpur. Stay indoors.",
      },
    },
  ];

  const simulateAlert = useCallback(
    (alert: ActiveAlert) => {
      triggerAlert(alert);
      router.push("/home/Home");
    },
    [router, triggerAlert],
  );

  const [activeTab, setActiveTab] = useState<TabType>("Today");

  const { today, thisWeek, earlier } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const startOfWeek = startOfToday - 6 * 86_400_000;

    const buckets: {
      today: AppNotification[];
      thisWeek: AppNotification[];
      earlier: AppNotification[];
    } = { today: [], thisWeek: [], earlier: [] };

    for (const n of notifications) {
      const stamp = n.timestamp || new Date().toISOString();
      const updated = { ...n, time: formatRelativeTime(stamp) };
      const ts = new Date(stamp).getTime();
      if (ts >= startOfToday) buckets.today.push(updated);
      else if (ts >= startOfWeek) buckets.thisWeek.push(updated);
      else buckets.earlier.push(updated);
    }
    return buckets;
  }, [notifications]);

  const displayedNotifications =
    activeTab === "Today" ? today : activeTab === "This Week" ? thisWeek : earlier;

  const headerAnim = useFadeIn(0, 280);
  const tabsAnim = useFadeInUp(120);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient header */}
      <Animated.View style={[styles.headerOuter, headerAnim]}>
        <LinearGradient
          colors={Gradients.hero as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.orbA} pointerEvents="none" />
        <View style={{ height: insets.top + 16 }} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <AppIcon name="chevron.left" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <AppText
              size={11}
              style={{
                color: "rgba(255,255,255,0.65)",
                letterSpacing: 1.6,
                fontWeight: "700",
              }}
            >
              UPDATES
            </AppText>
            <AppText size={18} style={styles.headerTitle}>
              Notifications
            </AppText>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <View style={styles.contentContainer}>
        {/* Tabs */}
        <Animated.View
          style={[
            styles.tabsContainer,
            tabsAnim,
            { backgroundColor: colors.backgroundElevated, borderColor: colors.borderLight },
            Elevation.sm,
            { shadowColor: "#0B1220" },
          ]}
        >
          {(
            [
              ["Today", today.length],
              ["This Week", thisWeek.length],
              ["Earlier", earlier.length],
            ] as [TabType, number][]
          ).map(([tab, count]) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.85}
                style={[
                  styles.tabButton,
                  isActive && { backgroundColor: colors.primary },
                ]}
              >
                <AppText
                  size={12}
                  style={{
                    fontWeight: "700",
                    color: isActive ? "#FFF" : colors.textSecondary,
                    letterSpacing: 0.3,
                  }}
                >
                  {tab}
                </AppText>
                <View
                  style={[
                    styles.countPill,
                    {
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.22)"
                        : colors.backgroundGrouped,
                    },
                  ]}
                >
                  <AppText
                    size={10}
                    style={{
                      color: isActive ? "#FFF" : colors.textSecondary,
                      fontWeight: "800",
                    }}
                  >
                    {count}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          })}
        </Animated.View>

        {/* Sim row */}
        <View style={styles.simRow}>
          {SIMULATIONS.map((sim) => (
            <TouchableOpacity
              key={sim.kind}
              onPress={() => simulateAlert(sim.alert)}
              activeOpacity={0.85}
              style={[
                styles.simButton,
                { backgroundColor: colors.backgroundElevated, borderColor: colors.borderLight },
                Elevation.sm,
                { shadowColor: "#0B1220" },
              ]}
            >
              <AppIcon name={sim.icon} size={14} color={colors.primary} />
              <AppText
                size={11}
                style={{
                  color: colors.textPrimary,
                  fontWeight: "700",
                  letterSpacing: 0.2,
                }}
              >
                {sim.label}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={displayedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <NotifCard
              item={item}
              index={index}
              markAsRead={markNotificationAsRead}
              colors={colors}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={7}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View
                style={[styles.emptyBellContainer, { backgroundColor: colors.primarySoft }]}
              >
                <Image
                  source={require("../../assets/images/no-notification.png")}
                  style={{ width: 72, height: 72, resizeMode: "contain" }}
                />
              </View>
              <AppText size={16} style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                You're all caught up
              </AppText>
              <AppText size={13} style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                New notifications will appear here.
              </AppText>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerOuter: {
    overflow: "hidden",
    paddingBottom: 36,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 1,
  },
  headerTitle: { color: "#FFF", fontWeight: "800", letterSpacing: -0.3, marginTop: 2 },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  orbA: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -60,
    backgroundColor: "rgba(6,182,212,0.18)",
  },
  contentContainer: { flex: 1, marginTop: -18 },

  tabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    padding: 5,
    borderRadius: Radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.pill,
  },
  countPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    minWidth: 22,
    alignItems: "center",
  },

  simRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
  },
  simButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  notificationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: Radii.lg,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: { flex: 1, paddingRight: 8, justifyContent: "center" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginLeft: 4,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Dimensions.get("window").height * 0.15,
  },
  emptyBellContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: { fontWeight: "800", marginBottom: 6, letterSpacing: -0.2 },
  emptySubtitle: {},
});
