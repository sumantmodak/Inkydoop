/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderImages } from "./images";
import type { GeneratedStory } from "@/lib/schemas";
import { uploadImage } from "@/lib/store/blobStore";
import { createGenerationTelemetry } from "./telemetry";

vi.mock("@/lib/env", () => ({
  env: { IMAGE_API_KEY: "test-key", IMAGE_MODEL: "test-image-model" },
}));

vi.mock("@/lib/store/blobStore", () => ({ uploadImage: vi.fn() }));

const story: GeneratedStory = {
  title: "The Lantern",
  hook: "A lantern lights an unexpected path.",
  genre: "adventure",
  theme: "curiosity",
  paragraphs: ["Maya lifted the lantern."],
  candidateVocab: ["lantern"],
  artDirection: {
    style: "watercolor",
    characters: [{ name: "Maya", look: "curly hair and a yellow coat" }],
    setting: "a moonlit garden",
  },
  images: [
    {
      role: "cover",
      afterParagraph: -1,
      prompt: "Maya enters the garden.",
      alt: "Maya holding a lantern in a garden",
    },
  ],
};

describe("renderImages", () => {
  beforeEach(() => {
    vi.mocked(uploadImage).mockReset();
  });

  it("requests 16:9 images and uploads the detected format", async () => {
    const png = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47]).copy(png);
    png.writeUInt32BE(1600, 16);
    png.writeUInt32BE(900, 20);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "image-request-1",
        model: "provider/image-model",
        provider: "provider-a",
        data: [{ b64_json: png.toString("base64") }],
        usage: { cost: 0.03 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const telemetry = createGenerationTelemetry();

    const result = await renderImages(story, "pack-id", { telemetry });

    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(request).toMatchObject({
      model: "test-image-model",
      aspect_ratio: "16:9",
      output_format: "webp",
      n: 1,
    });
    expect(uploadImage).toHaveBeenCalledWith(
      "pack-id/cover.png",
      png,
      "image/png",
    );
    expect(result[0].blobPath).toBe("pack-id/cover.png");
    expect(telemetry.images[0]).toMatchObject({
      role: "cover",
      status: "succeeded",
      requestId: "image-request-1",
      responseModel: "provider/image-model",
      provider: "provider-a",
      format: "png",
      width: 1600,
      height: 900,
      bytes: 24,
      costUsd: 0.03,
      moderationStatus: "not_run",
    });
  });
});
