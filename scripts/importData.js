const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const stations = require("./stations.json");

function loadServiceAccount() {
  const localKeyPath = path.resolve(__dirname, "serviceAccountKey.json");
  const envKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
  const googleCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      throw new Error(
        "Invalid FIREBASE_SERVICE_ACCOUNT_JSON. Please provide valid JSON.",
      );
    }
  }

  const candidatePaths = [localKeyPath, envKeyPath, googleCredsPath].filter(
    Boolean,
  );

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      const raw = fs.readFileSync(candidatePath, "utf8");
      return JSON.parse(raw);
    }
  }

  throw new Error(
    [
      "Missing Firebase service account credentials.",
      "Provide one of these:",
      "1) scripts/serviceAccountKey.json",
      "2) FIREBASE_SERVICE_ACCOUNT_KEY_PATH=<absolute path to json>",
      "3) GOOGLE_APPLICATION_CREDENTIALS=<absolute path to json>",
      "4) FIREBASE_SERVICE_ACCOUNT_JSON=<full json content>",
    ].join("\n"),
  );
}

const serviceAccount = loadServiceAccount();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const STATUS_PROFILES = {
  "High Flood Chance": {
    waterLevel: 4.2,
    trend: "Rising",
  },
  Warning: {
    waterLevel: 3.0,
    trend: "Rising",
  },
  Normal: {
    waterLevel: 1.8,
    trend: "Steady",
  },
  "Low Water Level": {
    waterLevel: 0.4,
    trend: "Falling",
  },
};

function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getSeedStatus(station, index) {
  const normalizedStatus = normalizeStatus(station.status);

  if (
    normalizedStatus === "high" ||
    normalizedStatus === "danger" ||
    normalizedStatus.includes("high flood") ||
    normalizedStatus.includes("flood")
  ) {
    return "High Flood Chance";
  }

  if (
    normalizedStatus.includes("low water") ||
    normalizedStatus.includes("water outage") ||
    normalizedStatus.includes("outage")
  ) {
    return "Low Water Level";
  }

  if (normalizedStatus === "warning") {
    return "Warning";
  }

  if (normalizedStatus === "normal") {
    // Demo-friendly distribution: convert some normal stations to low water risk.
    return index % 5 === 0 ? "Low Water Level" : "Normal";
  }

  const fallbackStatuses = ["High Flood Chance", "Normal", "Low Water Level"];
  return fallbackStatuses[index % fallbackStatuses.length];
}

async function importMasterList() {
  const batch = db.batch();

  stations.forEach((station, index) => {
    // Generate a clean ID (e.g., "Sg. Klang di Tmn Sri Muda 1" -> "sg_klang_di_tmn_sri_muda_1")
    const docId = station.station_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_") // replaces spaces and special chars with underscores
      .replace(/_+/g, "_"); // removes double underscores

    const seededStatus = getSeedStatus(station, index);
    const profile = STATUS_PROFILES[seededStatus] || STATUS_PROFILES.Normal;

    const docRef = db.collection("flood_stations").doc(docId);

    batch.set(docRef, {
      station_name: station.station_name,
      district: station.district,
      state: station.state,
      status: seededStatus,
      raw_status: station.status || "",
      // Store as a GeoPoint for Firebase Map queries
      location: new admin.firestore.GeoPoint(
        station.latitude,
        station.longitude,
      ),
      water_level: profile.waterLevel,
      trend: profile.trend,
      last_updated: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  try {
    await batch.commit();
    console.log(
      `✅ Success! ${stations.length} stations imported to 'flood_stations'.`,
    );
  } catch (error) {
    console.error("❌ Error importing data: ", error);
  }
}

importMasterList();
