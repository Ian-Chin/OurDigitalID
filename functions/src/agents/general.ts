import {ai, CHAT_MODEL} from "../genkit.js";
import {ChatInput, ChatOutput} from "../schemas.js";

const systemPrompt = `You are a helpful Malaysian government digital assistant for OurDigitalID.
You help citizens with:
- Government service information (JPJ, LHDN, JPN, EPF/KWSP, SOCSO/PERKESO)
- Document renewals (MyKad, passport, driving license)
- Tax filing and payments
- Queue status at government offices
- EPF withdrawals and employment benefits
- Healthcare services

Be concise, friendly, and informative. Use simple language.
If you don't know something specific, suggest the user visit the relevant government agency website or office.
You may respond in English, Bahasa Melayu, or Chinese based on the user's language.`;

export async function handleGeneral(input: ChatInput): Promise<ChatOutput> {
  const messages: Array<{role: "user" | "model"; content: Array<{text: string}>}> = [
    {role: "model", content: [{text: systemPrompt}]},
  ];

  for (const h of input.history ?? []) {
    messages.push({
      role: h.role as "user" | "model",
      content: [{text: h.content}],
    });
  }

  messages.push({role: "user", content: [{text: input.message}]});

  const response = await ai.generate({
    model: CHAT_MODEL,
    messages,
  });

  return {reply: response.text, agent: "general"};
}
