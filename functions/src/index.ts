import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {onCallGenkit} from "firebase-functions/https";
import * as nodemailer from "nodemailer";
import {ai} from "./genkit.js";
import {ChatInputSchema, ChatOutputSchema} from "./schemas.js";
import {routeIntent} from "./agents/router.js";
import {handleGeneral} from "./agents/general.js";
import {handleDocument} from "./agents/document.js";

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
  }
);

export const chat = onCallGenkit(
  {
    region: "asia-southeast1",
    authPolicy: () => true,
  },
  chatFlow
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
