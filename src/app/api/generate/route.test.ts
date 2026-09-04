/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { generateAndStore } from "@/lib/gen/pack";
import { POST } from "./route";

vi.mock("@/lib/admin-auth", () => ({ isAdminAuthorized: () => true }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: () => true }));
vi.mock("@/lib/store/read", () => ({ todayUtc: () => "2026-09-04" }));
vi.mock("@/lib/gen/model-selection", () => ({
  resolveGenerationModels: () => ({
    story: "z-ai/glm-5.2",
    learning: "deepseek/deepseek-v4-flash",
    image: "google/gemini-2.5-flash-image",
  }),
}));
vi.mock("@/lib/gen/pack", () => ({ generateAndStore: vi.fn() }));

const result = {
  id: "pack-id",
  date: "2026-09-04",
  tier: "growing" as const,
  generated: true as const,
  moderationStatus: "pending" as const,
  durationMs: 100,
  metadata: {
    models: {
      story: "z-ai/glm-5.2" as const,
      learning: "deepseek/deepseek-v4-flash" as const,
      image: "google/gemini-2.5-flash-image" as const,
    },
    tokens: { prompt: 1, completion: 1, total: 2 },
    costs: {},
    retries: { story: 0, learning: 0, invalidJson: 0 },
    images: { requested: 0, succeeded: 0, failed: 0, totalBytes: 0 },
  },
};

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateAndStore).mockImplementation(async (input) => {
      input.onProgress?.({
        stage: "story",
        label: "Writing the story",
        status: "active",
        timestamp: "2026-09-04T00:00:00.000Z",
      });
      return result;
    });
  });

  it("streams progress before the final result when requested", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/generate", {
        method: "POST",
        headers: {
          accept: "text/event-stream",
          "x-generate-key": "test",
        },
      }),
    );
    const body = await response.text();

    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(body.indexOf("event: progress")).toBeLessThan(
      body.indexOf("event: result"),
    );
    expect(body).toContain('"id":"pack-id"');
  });

  it("preserves the JSON response for ordinary clients", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/generate", {
        method: "POST",
        headers: { "x-generate-key": "test" },
      }),
    );

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toMatchObject({ ok: true, id: "pack-id" });
  });
});
