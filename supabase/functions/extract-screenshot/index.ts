// Supabase Edge Function: extract financial data from a screenshot.
//
// The browser never talks to Anthropic directly — this function holds the
// ANTHROPIC_API_KEY (set it with `supabase secrets set ANTHROPIC_API_KEY=...`)
// and Supabase's built-in JWT verification ensures only signed-in household
// members can call it.
//
// Deploy: supabase functions deploy extract-screenshot

import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Structured-output schema: Claude's response is constrained to exactly the
// ScreenshotExtraction shape the app expects (src/lib/screenshot.ts).
const extractionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["balances", "bills", "transactions", "sourceDescription"],
  properties: {
    sourceDescription: {
      type: "string",
      description: "One short line describing what this screenshot shows.",
    },
    balances: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["accountName", "balance"],
        properties: {
          accountName: { type: "string" },
          lastFour: {
            type: "string",
            description: "Last four digits of the account number, if visible.",
          },
          balance: { type: "number" },
        },
      },
    },
    bills: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "amount"],
        properties: {
          name: { type: "string" },
          amount: { type: "number", description: "Positive amount due." },
          dueDate: { type: "string", format: "date" },
          autopay: { type: "boolean" },
        },
      },
    },
    transactions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date", "merchant", "amount"],
        properties: {
          date: { type: "string", format: "date" },
          merchant: { type: "string" },
          amount: {
            type: "number",
            description: "Signed: expenses negative, income positive.",
          },
        },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `You extract financial data from screenshots for a household budgeting app.

Rules:
- Extract only what is clearly visible. Skip anything ambiguous rather than guessing.
- Dates in ISO format (YYYY-MM-DD). If the screenshot shows a day without a year, assume the nearest sensible occurrence relative to today.
- Transaction amounts are signed: purchases/payments/fees negative, deposits/income positive.
- Bill amounts are positive.
- Never include full account numbers, usernames, or SSNs — only the last four digits of account numbers.
- A "balance" is a current account balance, not an amount due. An amount due with a date is a bill.
- Scheduled/upcoming payments count as bills; completed ones count as transactions.`;

const ALLOWED_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return json(
      { error: "ANTHROPIC_API_KEY is not configured for this project." },
      500,
    );
  }

  let body: { image?: string; mediaType?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const { image, mediaType } = body;
  if (!image || !mediaType || !ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return json(
      { error: "Expected { image: <base64>, mediaType: image/png|jpeg|webp|gif }" },
      400,
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      output_config: {
        format: {
          type: "json_schema",
          schema: extractionSchema,
        },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/png",
                data: image,
              },
            },
            {
              type: "text",
              text: "Extract the balances, upcoming bills, and transactions from this screenshot.",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return json(
        { error: "The image could not be processed. Try a different screenshot." },
        422,
      );
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return json({ error: "No extraction produced" }, 502);
    }
    const extraction = JSON.parse(textBlock.text);
    return json({ extraction });
  } catch (error) {
    const message =
      error instanceof Anthropic.APIError
        ? `Extraction service error (${error.status})`
        : "Extraction failed";
    console.error("extract-screenshot error", error);
    return json({ error: message }, 502);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
