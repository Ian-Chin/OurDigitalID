import {getFunctions, httpsCallable} from "firebase/functions";
import {getApp} from "firebase/app";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface ChatResponse {
  reply: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<string> {
  try {
    const functions = getFunctions(getApp(), "asia-southeast1");
    const chatFn = httpsCallable<
      {message: string; history: ChatMessage[]},
      ChatResponse
    >(functions, "chat");

    const result = await chatFn({message, history});
    return result.data.reply;
  } catch (error) {
    throw error;
  }
}
