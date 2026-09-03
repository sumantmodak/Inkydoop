import { describe, expect, it } from "vitest";
import { packIdFromAudioPath, parseAudioPath } from "./audio-path";

describe("parseAudioPath", () => {
  it("accepts a pack-scoped MP3 path", () => {
    expect(parseAudioPath("pack-id/narration.mp3")).toBe(
      "pack-id/narration.mp3",
    );
  });

  it("rejects traversal and non-MP3 paths", () => {
    expect(parseAudioPath("../secret.mp3")).toBeNull();
    expect(parseAudioPath("pack-id/narration.wav")).toBeNull();
  });
});

describe("packIdFromAudioPath", () => {
  it("extracts the parent pack id", () => {
    expect(packIdFromAudioPath("pack-id/narration.mp3")).toBe("pack-id");
  });
});
