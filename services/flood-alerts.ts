import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

export interface FloodStationAlertRegion {
  id: string;
  station_name: string;
  status: string;
  latitude: number;
  longitude: number;
}

const FLOOD_ALERT_TASK_NAME = "flood-alert-geofencing";
const FLOOD_ALERT_RADIUS_METERS = 5000;

function isHighFloodChance(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  return normalizedStatus === "high" || normalizedStatus === "danger";
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureFloodNotificationChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "Flood Alerts",
    description: "High-priority flood proximity alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#D32F2F",
    sound: "default",
  });
}

export async function requestFloodAlertPermissions() {
  await ensureFloodNotificationChannel();

  const notificationPermissions = await Notifications.getPermissionsAsync();
  const notificationsGranted =
    notificationPermissions.granted ||
    notificationPermissions.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!notificationsGranted) {
    const notificationRequest = await Notifications.requestPermissionsAsync();
    const allowedNotifications =
      notificationRequest.granted ||
      notificationRequest.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (!allowedNotifications) {
      return false;
    }
  }

  const foregroundPermissions = await Location.getForegroundPermissionsAsync();

  if (foregroundPermissions.status !== "granted") {
    const foregroundRequest =
      await Location.requestForegroundPermissionsAsync();

    if (foregroundRequest.status !== "granted") {
      return false;
    }
  }

  const backgroundPermissions = await Location.getBackgroundPermissionsAsync();

  if (backgroundPermissions.status !== "granted") {
    const backgroundRequest =
      await Location.requestBackgroundPermissionsAsync();

    if (backgroundRequest.status !== "granted") {
      return false;
    }
  }

  return true;
}

export async function sendFloodAlertNotification(
  stationName: string,
  distanceInKm?: number,
) {
  await ensureFloodNotificationChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Flood Alert Near You!",
      body:
        distanceInKm !== undefined
          ? `${stationName} has High flood chances and is only ${distanceInKm.toFixed(1)}km away. Move to higher ground.`
          : `${stationName} has High flood chances and is near your current location. Move to higher ground.`,
      data: {
        stationName,
        distanceInKm,
        source: "flood-geofence",
      },
    },
    trigger: null,
  });
}

async function cancelFloodAlertMonitoring() {
  try {
    await Location.stopGeofencingAsync(FLOOD_ALERT_TASK_NAME);
  } catch (error) {
    console.warn("Flood alert geofencing was not active:", error);
  }
}

export async function registerFloodAlertMonitoring(
  stations: FloodStationAlertRegion[],
) {
  const permissionGranted = await requestFloodAlertPermissions();

  if (!permissionGranted) {
    await cancelFloodAlertMonitoring();
    return false;
  }

  const highRiskStations = stations
    .filter((station) => isHighFloodChance(station.status))
    .slice(0, 100)
    .map((station) => ({
      identifier: station.station_name,
      latitude: station.latitude,
      longitude: station.longitude,
      radius: FLOOD_ALERT_RADIUS_METERS,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

  if (highRiskStations.length === 0) {
    await cancelFloodAlertMonitoring();
    return true;
  }

  await Location.startGeofencingAsync(FLOOD_ALERT_TASK_NAME, highRiskStations);
  return true;
}

TaskManager.defineTask(FLOOD_ALERT_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error("Flood alert geofencing task error:", error);
    return;
  }

  if (!data || data.eventType !== Location.GeofencingEventType.Enter) {
    return;
  }

  const stationName = data.region?.identifier;

  if (!stationName) {
    return;
  }

  try {
    await sendFloodAlertNotification(stationName);
  } catch (notificationError) {
    console.error(
      "Failed to send flood alert notification:",
      notificationError,
    );
  }
});
