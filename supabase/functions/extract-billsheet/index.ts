const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

const EXTRACTION_PROMPT = `You are a surgical bill sheet parser. Extract structured data from the image of a bill sheet or surgical log.

CRITICAL PRIVACY RULE: Do NOT extract, include, or reference any patient identifiers — no patient names, initials, MRN, medical record numbers, date of birth, or any other PHI. If you see such information on the sheet, ignore it entirely. This is a hard requirement.

Return ONLY a valid JSON object with this exact shape (no markdown, no code fences, no commentary):
{
  "facility": "<hospital or facility name, or null if not visible>",
  "date": "<procedure date as YYYY-MM-DD, or null if not visible>",
  "items": [
    {
      "vendor": "<vendor/manufacturer name, or null>",
      "product_name": "<product or implant name, or null>",
      "item_number": "<catalog/item/reference number, or null>",
      "lot_number": "<lot or serial number, or null>",
      "description": "<brief description of the item, or null>",
      "quantity": <numeric quantity as a number, or null>,
      "cost": <unit cost as a number without currency symbol, or null>
    }
  ]
}

Rules:
- Extract every line item visible on the sheet.
- Use null for any field that is not legible or not present.
- cost must be a plain number (e.g. 1250.00), not a string.
- quantity must be a plain number (e.g. 1), not a string.
- Do not fabricate values — only extract what is actually visible.
- For handwritten numerals, prefer the interpretation that makes the line-item sum match any visible grand total.
- Return nothing outside the JSON object.

Self-verification (perform this INTERNALLY before writing your response — DO NOT include any of this reasoning in your output):
- If a "Requisition Total", "Grand Total", "G.T.", or similar summary value is visible on the sheet, compute the sum of (quantity × cost) for all line items.
- If your computed sum does NOT match the visible total, the most common cause is misreading a leading digit on a handwritten number (e.g. reading "865" when the actual value is "2865"). Re-examine each cost field with extra scrutiny and correct your extraction.
- Only return your response once the sum matches the total, OR once you have re-checked every cost field and are confident the visible total itself is unclear/illegible.

FINAL OUTPUT REQUIREMENT: Your entire response must be the final JSON object and nothing else. Do NOT write phrases like "Let me", "I need to", "Looking at", "Let's verify". Do NOT include markdown code fences. Do NOT include preamble, commentary, or explanation. Start your response with the opening brace { and end with the closing brace }. The first character of your response must be {.`;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "ANTHROPIC_API_KEY is not configured" }, 500);
  }

  let body: { image_base64?: string; media_type?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Request body must be valid JSON" }, 400);
  }

  const { image_base64, media_type = "image/jpeg" } = body;

  if (!image_base64 || typeof image_base64 !== "string") {
    return jsonResponse({ error: "image_base64 is required" }, 400);
  }

  const validMediaTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validMediaTypes.includes(media_type)) {
    return jsonResponse(
      { error: `media_type must be one of: ${validMediaTypes.join(", ")}` },
      400,
    );
  }

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type,
                  data: image_base64,
                },
              },
              {
                type: "text",
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      }),
    });
  } catch (err) {
    return jsonResponse(
      { error: "Failed to reach Anthropic API", detail: String(err) },
      502,
    );
  }

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text().catch(() => "(unreadable)");
    return jsonResponse(
      {
        error: "Anthropic API returned an error",
        status: anthropicRes.status,
        detail,
      },
      502,
    );
  }

  let anthropicBody: {
    content?: Array<{ type: string; text?: string }>;
    error?: { message: string };
  };
  try {
    anthropicBody = await anthropicRes.json();
  } catch {
    return jsonResponse({ error: "Anthropic API returned invalid JSON" }, 502);
  }

  const rawText = anthropicBody?.content?.find((b) => b.type === "text")?.text ?? "";

  // Strip markdown code fences if the model wraps the JSON
  const stripped = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  let extracted: { facility: string | null; date: string | null; items: unknown[] };
  try {
    extracted = JSON.parse(stripped);
  } catch {
    return jsonResponse(
      {
        error: "Model returned unparseable output",
        raw: rawText.slice(0, 500),
      },
      500,
    );
  }

  return jsonResponse(extracted);
});
