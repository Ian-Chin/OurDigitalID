import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase"; // Adjust this to point to your initialized firebase app

const functions = getFunctions(app);
const verifyOtpCode = httpsCallable(functions, "verifyOtpCode");

export const callVerifyOtp = async (userId: string, enteredOtp: string) => {
  try {
    const result = await verifyOtpCode({ userId, enteredOtp });
    return result.data as { success: boolean; message?: string };
  } catch (error: any) {
    console.error("Verification failed:", error.message);
    return { success: false, message: error.message };
  }
};
