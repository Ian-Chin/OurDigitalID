import {ai, CHAT_MODEL} from "../genkit.js";
import {ChatInput, ChatOutput} from "../schemas.js";

const defaultSystemPrompt = `You are a helpful Malaysian government digital assistant for OurDigitalID.
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
  // When the client picks a specialized agent card, it sends a persona via
  // context.agentPersona. We use that as the system prompt directly so the
  // model actually behaves as that agent — rather than the broad default.
  const persona = input.context?.agentPersona;
  const systemPrompt = persona && persona.trim().length > 0
    ? persona
    : defaultSystemPrompt;

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
