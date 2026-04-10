import {ai, CHAT_MODEL} from "../genkit.js";
import {ChatInput} from "../schemas.js";

const routerPrompt = `You are an intent classifier for a Malaysian government digital assistant.
Given the user's message, classify the intent as one of:
- "document" — if the user is asking about forms, documents, filling out paperwork, tax forms (BE, EA), medical claims, employment certificates, license applications, or needs help with document-related tasks
- "general" — for all other queries (queue status, general government info, greetings, etc.)

Respond with ONLY the single word "document" or "general". No other text.`;

export async function routeIntent(input: ChatInput): Promise<"general" | "document"> {
  // Short-circuit: form-fill and OCR modes always go to document agent
  if (input.context?.mode === "form-fill" || input.context?.mode === "ocr") {
    return "document";
  }

  // Use recent history for context (last 4 messages)
  const recentHistory = (input.history ?? []).slice(-4);
  const historyContext = recentHistory.length > 0
    ? "\n\nRecent conversation:\n" + recentHistory.map((h) => `${h.role}: ${h.content}`).join("\n")
    : "";

  const response = await ai.generate({
    model: CHAT_MODEL,
    messages: [
      {role: "model", content: [{text: routerPrompt}]},
      {role: "user", content: [{text: `User message: "${input.message}"${historyContext}`}]},
    ],
  });

  const result = response.text.trim().toLowerCase();
  return result === "document" ? "document" : "general";
}
