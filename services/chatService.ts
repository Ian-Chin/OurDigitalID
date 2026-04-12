import {getFunctions, httpsCallable} from "firebase/functions";
import {app} from "./firebase";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface ChatContext {
  mode?: "chat" | "form-fill" | "ocr";
  documentType?: string;
  existingFields?: Record<string, string>;
  imageBase64?: string;
}

export interface ChatResponse {
  reply: string;
  agent?: "general" | "document";
  formData?: Record<string, string>;
  action?: { type: string; documentType?: string };
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  context?: ChatContext
): Promise<ChatResponse> {
  const functions = getFunctions(app, "asia-southeast1");
  const chatFn = httpsCallable<
    {message: string; history: ChatMessage[]; context?: ChatContext},
    ChatResponse
  >(functions, "chat");

  const result = await chatFn({message, history, context});
  return result.data;
}
