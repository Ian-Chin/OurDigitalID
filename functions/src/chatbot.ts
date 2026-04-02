import {genkit, z} from "genkit";
import {vertexAI, gemini20Flash} from "@genkit-ai/vertexai";
import {onCallGenkit} from "firebase-functions/https";

const ai = genkit({
  plugins: [
    vertexAI({
      projectId: "aihackathon-491109",
      location: "asia-southeast1",
    }),
  ],
});

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

const chatFlow = ai.defineFlow(
  {
    name: "chat",
    inputSchema: z.object({
      message: z.string(),
      history: z.array(
        z.object({
          role: z.enum(["user", "model"]),
          content: z.string(),
        })
      ).optional(),
    }),
    outputSchema: z.object({
      reply: z.string(),
    }),
  },
  async (input) => {
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
      model: gemini20Flash,
      messages,
    });

    return {reply: response.text};
  }
);

export const chat = onCallGenkit(
  {
    region: "asia-southeast1",
    authPolicy: () => true,
  },
  chatFlow
);
