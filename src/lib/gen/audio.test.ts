/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateNarration, narrationText } from "./audio";
import { uploadAudio } from "@/lib/store/blobStore";
import { createGenerationTelemetry } from "./telemetry";
import type { Story } from "@/lib/schemas";

vi.mock("@/lib/env", () => ({ env: { OPENROUTER_API_KEY: "test-key" } }));
vi.mock("@/lib/store/blobStore", () => ({ uploadAudio: vi.fn() }));

const story: Story = {
  title: "The Lantern",
  hook: "A light appears.",
  genre: "mystery",
  theme: "curiosity",
  paragraphs: ["Maya found a lantern.", "It glowed warmly."],
  readingTimeMin: 2,
  targetWords: ["lantern"],
  artDirection: { style: "watercolor", characters: [], setting: "an attic" },
  images: [],
};

describe("generateNarration", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests MP3 speech and uploads the raw bytes", async () => {
    const data = Buffer.from("mp3-data");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(data, {
          status: 200,
          headers: {
            "content-type": "audio/mpeg",
            "x-generation-id": "audio-123",
          },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          data: { api_type: "tts", total_cost: 0.0042 },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const telemetry = createGenerationTelemetry();

    const result = await generateNarration(story, "pack-id", {
      narration: {
        model: "microsoft/mai-voice-2-flash",
        voice: "en-US-Harper:MAI-Voice-2",
      },
      telemetry,
    });

    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(request).toEqual({
      model: "microsoft/mai-voice-2-flash",
      input: narrationText(story),
      voice: "en-US-Harper:MAI-Voice-2",
      response_format: "mp3",
    });
    expect(uploadAudio).toHaveBeenCalledWith("pack-id/narration.mp3", data);
    expect(result).toMatchObject({
      blobPath: "pack-id/narration.mp3",
      format: "mp3",
      bytes: data.length,
      generationId: "audio-123",
      costUsd: 0.0042,
      estimatedCostUsd: narrationText(story).length * 0.000015,
    });
    expect(telemetry.audio).toMatchObject({
      status: "succeeded",
      moderationStatus: "not_run",
      inputCharacters: narrationText(story).length,
    });
    expect(telemetry.prompts[0].user).toBe(narrationText(story));
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://openrouter.ai/api/v1/generation?id=audio-123",
    );
  });

  it("records failure without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("no", { status: 503 })),
    );
    const telemetry = createGenerationTelemetry();

    await expect(
      generateNarration(story, "pack-id", {
        narration: { model: "x-ai/grok-voice-tts-1.0", voice: "ara" },
        telemetry,
      }),
    ).resolves.toBeNull();
    expect(telemetry.audio).toMatchObject({
      status: "failed",
      moderationStatus: "not_run",
      error: "HTTP 503",
    });
    expect(uploadAudio).not.toHaveBeenCalled();
  });
});
