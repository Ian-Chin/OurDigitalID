import * as functions from "firebase-functions/v2";
import * as nodemailer from "nodemailer";

// Setup your email "Transporter" (Your email provider details)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "joslyn.cyn05@gmail.com",
    pass: "vrat erwu xgsv iozb",
  },
});

export const sendOtpOnCreate = functions.firestore.onDocumentCreated(
  "users/{docId}",
  async (event) => {
    const data = event.data?.data();
    const email = data?.email;

    if (!email) return;

    // 1. Generate a random 6-digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save the OTP back to the document so the app can verify it later
    await event.data?.ref.update({
      otp: otpCode,
      otpCreatedAt: new Date(),
    });

    // 3. Send the email
    const mailOptions = {
      from: '"OurDigitalID" <your-email@gmail.com>',
      to: email,
      subject: "Your Verification Code",
      text: `Your 6-digit verification code is: ${otpCode}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${email}`);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  },
);
