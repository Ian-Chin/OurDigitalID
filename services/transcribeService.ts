import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
  language: "en" | "ms" | "cn" = "en",
): Promise<string> {
  const functions = getFunctions(app, "asia-southeast1");
  const fn = httpsCallable<
    { audioBase64: string; mimeType: string; language: string },
    { text: string }
  >(functions, "transcribe");
  const result = await fn({ audioBase64, mimeType, language });
  return result.data.text ?? "";
}
