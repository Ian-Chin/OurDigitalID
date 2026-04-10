import {z} from "genkit";

export const ChatInputSchema = z.object({
  message: z.string(),
  history: z.array(
    z.object({
      role: z.enum(["user", "model"]),
      content: z.string(),
    })
  ).optional(),
  // Context is loosely typed here because the client may send null.
  // Agents validate the shape themselves.
  context: z.any().optional(),
});

export const ChatOutputSchema = z.object({
  reply: z.string(),
  agent: z.enum(["general", "document"]).optional(),
  formData: z.record(z.string()).optional(),
  action: z.object({
    type: z.string(),
    documentType: z.string().optional(),
  }).optional(),
});

export interface ChatContext {
  mode?: "chat" | "form-fill" | "ocr";
  documentType?: string;
  existingFields?: Record<string, string>;
  imageBase64?: string;
}

export interface ChatInput {
  message: string;
  history?: {role: "user" | "model"; content: string}[];
  context?: ChatContext | null;
}

export type ChatOutput = z.infer<typeof ChatOutputSchema>;
