import {genkit} from "genkit";
import {vertexAI} from "@genkit-ai/vertexai";

export const ai = genkit({
  plugins: [
    vertexAI({
      projectId: process.env.GCLOUD_PROJECT || "ourdigitalid-acebf",
      location: "asia-southeast1",
    }),
  ],
});

export const CHAT_MODEL = "vertexai/gemini-2.5-flash";
