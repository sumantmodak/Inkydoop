import { z } from "zod";
import { env } from "@/lib/env";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatJsonOptions {
  temperature?: number;
  /** Extra attempts if the model returns unparseable/invalid JSON. Default 2. */
  maxRetries?: number;
  signal?: AbortSignal;
}

/**
 * Call an OpenRouter chat model in JSON mode and validate the result against a
 * Zod schema. Retries only on invalid/unparseable JSON, not on transport errors.
 */
export async function chatJson<T>(
  model: string,
  messages: ChatMessage[],
  schema: z.ZodType<T>,
  options: ChatJsonOptions = {},
): Promise<T> {
  const { temperature, maxRetries = 2, signal } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        response_format: { type: "json_object" },
      }),
      signal,
    });

    if (!res.ok) {
      throw new Error(
        `OpenRouter request failed: ${res.status} ${res.statusText}`,
      );
    }

    const body = await res.json();
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      lastError = new Error("OpenRouter response missing message content");
      continue;
    }

    try {
      return schema.parse(JSON.parse(content));
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    `chatJson: no valid JSON from ${model} after ${maxRetries + 1} attempts: ${String(lastError)}`,
  );
}
