/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { chatJson } from "./openrouter";
import type { ProviderCall } from "@/lib/schemas";

vi.mock("@/lib/env", () => ({
  env: { OPENROUTER_API_KEY: "test-key" },
}));

describe("chatJson telemetry", () => {
  it("records invalid and successful provider attempts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "request-1",
          model: "provider/model-v1",
          provider: "provider-a",
          choices: [{ message: { content: "not json" } }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 2,
            total_tokens: 12,
            cost: 0.001,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "request-2",
          model: "provider/model-v1",
          provider: "provider-a",
          choices: [{ message: { content: '{"value":"ok"}' } }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 4,
            total_tokens: 14,
            cost: 0.002,
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const calls: ProviderCall[] = [];

    const result = await chatJson(
      "requested/model",
      [{ role: "user", content: "test" }],
      z.object({ value: z.string() }),
      { step: "story", onCall: (call) => calls.push(call) },
    );

    expect(result).toEqual({ value: "ok" });
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({
      step: "story",
      attempt: 1,
      model: "requested/model",
      requestId: "request-1",
      provider: "provider-a",
      status: "invalid_response",
      totalTokens: 12,
      costUsd: 0.001,
    });
    expect(calls[1]).toMatchObject({
      attempt: 2,
      requestId: "request-2",
      status: "succeeded",
      totalTokens: 14,
      costUsd: 0.002,
    });
  });
});
