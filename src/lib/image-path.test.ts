import { describe, expect, it } from "vitest";
import { packIdFromImagePath, parseImagePath } from "./image-path";

describe("parseImagePath", () => {
  it("accepts supported image paths", () => {
    expect(parseImagePath("pack-id/scene-1.webp")).toBe("pack-id/scene-1.webp");
  });

  it("rejects traversal and unsupported formats", () => {
    expect(parseImagePath("../secret.png")).toBeNull();
    expect(parseImagePath("pack-id/story.svg")).toBeNull();
  });
});

describe("packIdFromImagePath", () => {
  it("extracts the pack id", () => {
    expect(packIdFromImagePath("pack-id/cover.png")).toBe("pack-id");
  });
});
