import { z } from "zod";
import { env } from "@/lib/env";
import type { ProviderCall } from "@/lib/schemas";

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
  step?: string;
  onCall?: (call: ProviderCall) => void;
}

interface OpenRouterBody {
  id?: unknown;
  model?: unknown;
  provider?: unknown;
  choices?: { message?: { content?: unknown } }[];
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    total_tokens?: unknown;
    cost?: unknown;
  };
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : 0;
}

function callRecord(
  body: OpenRouterBody,
  input: {
    step: string;
    attempt: number;
    model: string;
    startedAt: string;
    durationMs: number;
    status: ProviderCall["status"];
    error?: string;
  },
): ProviderCall {
  const promptTokens = numberOrZero(body.usage?.prompt_tokens);
  const completionTokens = numberOrZero(body.usage?.completion_tokens);
  const reportedTotal = numberOrZero(body.usage?.total_tokens);
  const cost = body.usage?.cost;
  return {
    ...input,
    responseModel: typeof body.model === "string" ? body.model : undefined,
    provider: typeof body.provider === "string" ? body.provider : undefined,
    requestId: typeof body.id === "string" ? body.id : undefined,
    promptTokens,
    completionTokens,
    totalTokens: reportedTotal || promptTokens + completionTokens,
    costUsd:
      typeof cost === "number" && Number.isFinite(cost) && cost >= 0
        ? cost
        : undefined,
  };
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
  const {
    temperature,
    maxRetries = 2,
    signal,
    step = "unspecified",
    onCall,
  } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const startedAt = new Date().toISOString();
    const start = Date.now();
    let res: Response;
    try {
      res = await fetch(OPENROUTER_URL, {
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
    } catch (error) {
      onCall?.(
        callRecord(
          {},
          {
            step,
            attempt: attempt + 1,
            model,
            startedAt,
            durationMs: Date.now() - start,
            status: "failed",
            error: error instanceof Error ? error.name : "request_failed",
          },
        ),
      );
      throw error;
    }

    if (!res.ok) {
      onCall?.(
        callRecord(
          {},
          {
            step,
            attempt: attempt + 1,
            model,
            startedAt,
            durationMs: Date.now() - start,
            status: "failed",
            error: `HTTP ${res.status}`,
          },
        ),
      );
      throw new Error(
        `OpenRouter request failed: ${res.status} ${res.statusText}`,
      );
    }

    const body = (await res.json()) as OpenRouterBody;
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      lastError = new Error("OpenRouter response missing message content");
      onCall?.(
        callRecord(body, {
          step,
          attempt: attempt + 1,
          model,
          startedAt,
          durationMs: Date.now() - start,
          status: "invalid_response",
          error: "missing_content",
        }),
      );
      continue;
    }

    try {
      const value = schema.parse(JSON.parse(content));
      onCall?.(
        callRecord(body, {
          step,
          attempt: attempt + 1,
          model,
          startedAt,
          durationMs: Date.now() - start,
          status: "succeeded",
        }),
      );
      return value;
    } catch (err) {
      lastError = err;
      onCall?.(
        callRecord(body, {
          step,
          attempt: attempt + 1,
          model,
          startedAt,
          durationMs: Date.now() - start,
          status: "invalid_response",
          error: "schema_validation",
        }),
      );
    }
  }

  throw new Error(
    `chatJson: no valid JSON from ${model} after ${maxRetries + 1} attempts: ${String(lastError)}`,
  );
}
