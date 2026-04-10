import {ai, CHAT_MODEL} from "../genkit.js";
import {ChatInput, ChatOutput} from "../schemas.js";
import {DOCUMENT_FIELDS, describeFieldsForDocument} from "../tools/documentTools.js";

const chatSystemPrompt = `You are a document specialist assistant for OurDigitalID, a Malaysian government digital identity app.
You are an expert on Malaysian government forms and documents including:
- BE Form (individual tax return)
- EA Form (employment income statement)
- Tax Returns
- Medical Claims
- Employment Certificates
- License Applications (JPJ driving license)

Help users understand what each form requires, guide them through filling out documents, explain field meanings, and answer any questions about Malaysian government paperwork.
Be concise, friendly, and informative. Use simple language.
You may respond in English, Bahasa Melayu, or Chinese based on the user's language.

IMPORTANT: If the user wants to scan, upload, or photograph a document to extract data from it, you MUST include the marker [ACTION:SCAN:<docType>] at the END of your reply (after your normal response text).
Use these document type codes: be_form, ea_form, tax_return, medical_claim, employment_cert, license_app.
If the document type is unclear, use "other".
Examples:
- User: "I want to scan my BE form" → Reply normally, then append [ACTION:SCAN:be_form]
- User: "Can you scan my tax return?" → Reply normally, then append [ACTION:SCAN:tax_return]
- User: "Upload my medical claim" → Reply normally, then append [ACTION:SCAN:medical_claim]`;

function buildFormFillPrompt(docType: string, existingFields?: Record<string, string>): string {
  const fieldDesc = describeFieldsForDocument(docType);
  const existing = existingFields && Object.keys(existingFields).length > 0
    ? `\n\nThe user has already provided these fields:\n${JSON.stringify(existingFields, null, 2)}`
    : "";

  return `You are a form-filling assistant. Generate realistic sample/placeholder data for a Malaysian government document.

Document type: ${docType}
Required fields:
${fieldDesc}
${existing}

IMPORTANT: Return ONLY a valid JSON object with the field keys as keys and appropriate sample values as strings.
- IC Number format: YYMMDD-SS-NNNN (e.g., "950115-14-5678")
- Date of Birth format: DD/MM/YYYY
- Use realistic Malaysian names, addresses, and data
- If existing fields are provided, keep those values and only fill in missing ones
- Do NOT include any explanation, markdown, or text outside the JSON object.`;
}

function buildOcrPrompt(docType: string): string {
  const fieldDesc = describeFieldsForDocument(docType);
  return `You are an OCR extraction assistant. Extract all visible text fields from this scanned document image.

Document type: ${docType}
Expected fields:
${fieldDesc}

IMPORTANT: Return ONLY a valid JSON object with the field keys as keys and extracted values as strings.
- If a field is not visible or unreadable, omit it or set it to an empty string.
- IC Number format: YYMMDD-SS-NNNN
- Date of Birth format: DD/MM/YYYY
- Extract exactly what you see — do not fabricate data.
- Do NOT include any explanation, markdown, or text outside the JSON object.`;
}

export async function handleDocument(input: ChatInput): Promise<ChatOutput> {
  const context = input.context;

  // OCR mode: extract fields from scanned image
  if (context?.mode === "ocr" && context.imageBase64) {
    const docType = context.documentType || "be_form";
    const fields = DOCUMENT_FIELDS[docType];
    if (!fields) {
      return {reply: `Unknown document type: ${docType}`, agent: "document"};
    }

    const prompt = buildOcrPrompt(docType);

    const response = await ai.generate({
      model: CHAT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {text: prompt},
            {media: {contentType: "image/jpeg", url: `data:image/jpeg;base64,${context.imageBase64}`}},
          ],
        },
      ],
    });

    let formData: Record<string, string> = {};
    const text = response.text.trim();
    try {
      // Try direct parse first
      formData = JSON.parse(text);
    } catch {
      try {
        // Strip markdown code fences
        const stripped = text
          .replace(/^```(?:json)?\s*/im, "")
          .replace(/\s*```\s*$/m, "")
          .trim();
        formData = JSON.parse(stripped);
      } catch {
        // Try to find JSON object anywhere in the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            formData = JSON.parse(jsonMatch[0]);
          } catch {
            // All parsing attempts failed
          }
        }
      }
    }

    // Return whatever we managed to extract — even partial results
    if (Object.keys(formData).length === 0) {
      return {
        reply: "I could see the document but had trouble extracting the fields. Raw response: " + text.substring(0, 200),
        agent: "document",
        formData,
      };
    }

    return {
      reply: "I've extracted the fields from your scanned document. Please review and correct any information.",
      agent: "document",
      formData,
    };
  }

  // Form-fill mode: return structured data
  if (context?.mode === "form-fill" && context.documentType) {
    const docType = context.documentType;
    const fields = DOCUMENT_FIELDS[docType];
    if (!fields) {
      return {
        reply: `Unknown document type: ${docType}`,
        agent: "document",
      };
    }

    const prompt = buildFormFillPrompt(docType, context.existingFields);

    const response = await ai.generate({
      model: CHAT_MODEL,
      messages: [
        {role: "user", content: [{text: prompt}]},
      ],
    });

    // Parse the JSON response
    let formData: Record<string, string> = {};
    try {
      const text = response.text.trim();
      // Strip markdown code fences if present
      const jsonStr = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      formData = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, return raw text as reply
      return {
        reply: "I generated some data but couldn't parse it properly. Please try again.",
        agent: "document",
      };
    }

    // Merge with existing fields (existing take priority if not empty)
    if (context.existingFields) {
      for (const [key, val] of Object.entries(context.existingFields)) {
        if (val && val.trim()) {
          formData[key] = val;
        }
      }
    }

    return {
      reply: "I've filled in the form fields for you. Please review and update any information as needed.",
      agent: "document",
      formData,
    };
  }

  // Chat mode: conversational document guidance
  const messages: Array<{role: "user" | "model"; content: Array<{text: string}>}> = [
    {role: "model", content: [{text: chatSystemPrompt}]},
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

  // Post-process: extract [ACTION:SCAN:<docType>] marker if present
  let replyText = response.text;
  let action: {type: string; documentType?: string} | undefined;
  const actionMatch = replyText.match(/\[ACTION:SCAN:(\w+)\]/);
  if (actionMatch) {
    replyText = replyText.replace(/\s*\[ACTION:SCAN:\w+\]\s*/, "").trim();
    action = {type: "scan", documentType: actionMatch[1]};
  }

  return {reply: replyText, agent: "document", action};
}
