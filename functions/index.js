// Firebase Cloud Function: extract financial data from a screenshot.
//
// The browser never talks to Anthropic directly — this callable function
// holds the ANTHROPIC_API_KEY secret and requires a signed-in Firebase user.
//
// Setup: firebase functions:secrets:set ANTHROPIC_API_KEY
// Deploy: firebase deploy --only functions

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const Anthropic = require("@anthropic-ai/sdk");

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

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
};

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

exports.extractScreenshot = onCall(
  {
    secrets: [anthropicApiKey],
    memory: "512MiB",
    timeoutSeconds: 120,
    // Callable functions verify the Firebase Auth token automatically;
    // request.auth is null for unauthenticated calls.
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in to import screenshots.");
    }
    const { image, mediaType } = request.data ?? {};
    if (
      typeof image !== "string" ||
      !image ||
      !ALLOWED_MEDIA_TYPES.has(mediaType)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Expected { image: <base64>, mediaType: image/png|jpeg|webp|gif }",
      );
    }

    const client = new Anthropic({ apiKey: anthropicApiKey.value() });

    let response;
    try {
      response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        output_config: {
          format: { type: "json_schema", schema: extractionSchema },
        },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: image },
              },
              {
                type: "text",
                text: "Extract the balances, upcoming bills, and transactions from this screenshot.",
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error("extract-screenshot error", error);
      const status =
        error instanceof Anthropic.APIError ? error.status : undefined;
      throw new HttpsError(
        "unavailable",
        status ? `Extraction service error (${status})` : "Extraction failed",
      );
    }

    if (response.stop_reason === "refusal") {
      throw new HttpsError(
        "failed-precondition",
        "The image could not be processed. Try a different screenshot.",
      );
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock) {
      throw new HttpsError("internal", "No extraction produced");
    }
    return { extraction: JSON.parse(textBlock.text) };
  },
);
