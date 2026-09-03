/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { downloadAudio } from "@/lib/store/blobStore";
import { isPackPublic } from "@/lib/store/tableStore";
import { GET } from "./route";

vi.mock("@/lib/store/blobStore", () => ({ downloadAudio: vi.fn() }));
vi.mock("@/lib/store/tableStore", () => ({ isPackPublic: vi.fn() }));

describe("GET /api/audio", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not expose audio for a private pack", async () => {
    vi.mocked(isPackPublic).mockResolvedValue(false);
    const response = await GET(
      new NextRequest(
        "http://localhost/api/audio?path=pack-id%2Fnarration.mp3",
      ),
    );

    expect(response.status).toBe(404);
    expect(downloadAudio).not.toHaveBeenCalled();
  });

  it("serves byte ranges for an approved pack", async () => {
    vi.mocked(isPackPublic).mockResolvedValue(true);
    vi.mocked(downloadAudio).mockResolvedValue(Buffer.from("0123456789"));
    const response = await GET(
      new NextRequest(
        "http://localhost/api/audio?path=pack-id%2Fnarration.mp3",
        { headers: { range: "bytes=2-5" } },
      ),
    );

    expect(response.status).toBe(206);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
    expect(response.headers.get("content-disposition")).toBe(
      "inline; filename=story-narration.mp3",
    );
    expect(response.headers.get("cross-origin-resource-policy")).toBe(
      "same-origin",
    );
    expect(response.headers.get("content-range")).toBe("bytes 2-5/10");
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("2345");
  });
});
