import { getFirestore } from "firebase-admin/firestore";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import * as nodemailer from "nodemailer";

// 1. Setup the Transporter using Environment Variables
// We define this outside the function so it's ready to use
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "joslyn.cyn05@gmail.com",
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
      from: '"OurDigitalID" <joslyn.cyn05@gmail.com>',
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

export const verifyOtpCode = onCall(async (request) => {
  const { userId, enteredOtp } = request.data;
  const db = getFirestore();

  if (!userId || !enteredOtp) {
    throw new HttpsError("invalid-argument", "Missing User ID or OTP.");
  }

  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new HttpsError("not-found", "User not found.");
  }

  const userData = userSnap.data();
  const savedOtp = userData?.otp;
  const createdAt = userData?.otpCreatedAt?.toDate();

  // 1. Check expiration (10 minutes)
  const isExpired = createdAt && Date.now() - createdAt.getTime() > 600000;

  if (isExpired) {
    throw new HttpsError("deadline-exceeded", "OTP has expired.");
  }

  // 2. Compare OTPs
  if (savedOtp === enteredOtp) {
    await userRef.update({
      isVerified: true,
      otp: null, // Delete it so it can't be used twice
    });
    return { success: true, message: "Verified successfully!" };
  } else {
    throw new HttpsError("permission-denied", "Invalid OTP code.");
  }
});
