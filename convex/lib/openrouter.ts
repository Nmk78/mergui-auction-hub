import { ConvexError } from "convex/values";
import { z } from "zod";

const completionResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.union([
            z.string(),
            z.array(
              z.object({
                type: z.string(),
                text: z.string().optional(),
              }),
            ),
          ]),
        }),
      }),
    )
    .min(1),
});

export async function openRouterCompletion(input: {
  model: string;
  messages: unknown[];
  responseFormat?: Record<string, unknown>;
  temperature?: number;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new ConvexError(
      "AI service is not configured. Add OPENROUTER_API_KEY to the Convex deployment.",
    );
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.SITE_URL ? { "HTTP-Referer": process.env.SITE_URL } : {}),
      "X-OpenRouter-Title": "MERGUI Auction Hub",
    },
    body: JSON.stringify({
      model: input.model,
      messages: input.messages,
      response_format: input.responseFormat,
      temperature: input.temperature ?? 0.2,
      stream: false,
      ...(input.responseFormat
        ? {
            provider: { require_parameters: true },
            plugins: [{ id: "response-healing" }],
          }
        : {}),
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("OpenRouter request failed", response.status, body.slice(0, 500));
    throw new ConvexError(
      response.status === 429
        ? "The AI service is busy. Wait a moment and try again."
        : "The AI service could not complete this request.",
    );
  }

  const parsed = completionResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new ConvexError("The AI service returned an unreadable response.");
  }
  const content = parsed.data.choices[0].message.content;
  if (typeof content === "string") {
    return content;
  }
  return content
    .map((part) => part.text)
    .filter((part): part is string => Boolean(part))
    .join("\n");
}
