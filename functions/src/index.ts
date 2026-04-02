import { onDocumentCreated } from "firebase-functions/v2/firestore";
export { chat } from "./chatbot.js";
import * as nodemailer from "nodemailer";
export { chat } from "./chatbot.js";

// 1. Setup the Transporter using Environment Variables
// We define this outside the function so it's ready to use
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    // This will pull the secret you set with 'firebase functions:secrets:set'
    pass: process.env.GMAIL_PASS,
  },
});

// 2. The Cloud Function
export const sendOtpOnCreate = onDocumentCreated(
  {
    document: "users/{docId}",
    secrets: ["GMAIL_PASS"], // CRITICAL: This allows the function to access the secret
  },
  async (event) => {
    const data = event.data?.data();
    const email = data?.email;

    if (!email) {
      console.log("No email found in document, skipping.");
      return;
    }

    // Generate a random 6-digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save the OTP and timestamp back to Firestore for verification
    await event.data?.ref.update({
      otp: otpCode,
      otpCreatedAt: new Date(),
    });

    // Prepare the email
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
