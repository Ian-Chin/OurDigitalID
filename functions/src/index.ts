import axios from "axios";
import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCallGenkit } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as nodemailer from "nodemailer";
import { handleDocument } from "./agents/document.js";
import { handleGeneral } from "./agents/general.js";
import { routeIntent } from "./agents/router.js";
import { ai } from "./genkit.js";
import { ChatInputSchema, ChatOutputSchema } from "./schemas.js";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// ── Chat Cloud Function (router-based multi-agent) ──

const chatFlow = ai.defineFlow(
  {
    name: "chat",
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const intent = await routeIntent(input);

    if (intent === "document") {
      return handleDocument(input);
    }
    return handleGeneral(input);
  },
);

export const chat = onCallGenkit(
  {
    region: "asia-southeast1",
    authPolicy: () => true,
  },
  chatFlow,
);

// ── OTP Email Cloud Function ──

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export const sendOtpOnCreate = onDocumentCreated(
  {
    document: "users/{docId}",
    secrets: ["GMAIL_PASS"],
  },
  async (event) => {
    const data = event.data?.data();
    const email = data?.email;

    if (!email) {
      console.log("No email found in document, skipping.");
      return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await event.data?.ref.update({
      otp: otpCode,
      otpCreatedAt: new Date(),
    });

    const mailOptions = {
      from: `"OurDigitalID" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      text: `Your 6-digit verification code is: ${otpCode}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`OTP ${otpCode} successfully sent to ${email}`);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  },
);

// ── Flood Data Scraper Cloud Function ──

async function scrapeData() {
  // Use the main landing page or the specific state page as the target
  // We use the main landing page URL which is more stable
  const url = "https://publicinfobanjir.water.gov.my/view/state?stateid=ALL";

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://publicinfobanjir.water.gov.my/",
      },
    });
    // If the PHP endpoint continues to 404, we must parse the HTML table from this URL
    return response.data;
  } catch (error) {
    console.error(
      "Scraper 404 Error: The website blocked the direct data request.",
    );
    throw error;
  }
}

export const updateFloodData = onSchedule("*/15 * * * *", async (event) => {
  const db = admin.firestore();
  const data = await scrapeData();

  const batch = db.batch();

  // Example mapping to match your specified format
  data.forEach((station: any) => {
    const stationId = station.station_name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");
    const docRef = db.collection("flood_stations").doc(stationId);
    const lat = parseFloat(station.lat); // Assuming the scraper finds 'lat'
    const lng = parseFloat(station.lng); // Assuming the scraper finds 'lng'

    batch.set(
      docRef,
      {
        station_name: station.station_name,
        status: station.status,
        // This format is required for distance calculations
        location: new admin.firestore.GeoPoint(lat, lng),
        last_updated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();
});
