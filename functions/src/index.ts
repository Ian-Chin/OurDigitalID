import axios from "axios";
import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, onCallGenkit } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as nodemailer from "nodemailer";
import { handleDocument } from "./agents/document.js";
import { handleGeneral } from "./agents/general.js";
import { routeIntent } from "./agents/router.js";
import { ai, CHAT_MODEL } from "./genkit.js";
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

// ── Audio Transcription (Gemini multimodal) ──

export const transcribe = onCall(
  { region: "asia-southeast1", memory: "512MiB", timeoutSeconds: 60 },
  async (request) => {
    const { audioBase64, mimeType, language } = (request.data ?? {}) as {
      audioBase64?: string;
      mimeType?: string;
      language?: "en" | "ms" | "cn";
    };
    if (!audioBase64 || typeof audioBase64 !== "string") {
      throw new Error("audioBase64 required");
    }
    const type = mimeType || "audio/mp4";
    const langHint =
      language === "ms" ? "Bahasa Melayu"
        : language === "cn" ? "Chinese (Simplified)"
          : "English";

    const result = await ai.generate({
      model: CHAT_MODEL,
      prompt: [
        {
          text:
            `Transcribe the spoken audio verbatim in ${langHint}. ` +
            "Return ONLY the transcribed text — no quotes, no labels, no preamble, no explanation.",
        },
        { media: { url: `data:${type};base64,${audioBase64}`, contentType: type } },
      ],
    });

    const text = (result.text ?? "").trim().replace(/^["']|["']$/g, "");
    return { text };
  },
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

export const updateFloodData = onSchedule(
  { schedule: "*/15 * * * *", region: "asia-southeast1" },
  async () => {
    const db = admin.firestore();
    const data = await scrapeData();

    const batch = db.batch();

    data.forEach((station: any) => {
      const stationId = station.station_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      const docRef = db.collection("flood_stations").doc(stationId);
      const lat = parseFloat(station.lat);
      const lng = parseFloat(station.lng);

      batch.set(
        docRef,
        {
          station_name: station.station_name,
          status: station.status,
          location: new admin.firestore.GeoPoint(lat, lng),
          last_updated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });

    await batch.commit();
  },
);
