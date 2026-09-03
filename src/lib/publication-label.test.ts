import { describe, expect, it } from "vitest";
import { publicationLabel } from "./publication-label";

describe("publicationLabel", () => {
  it("identifies today's stored story", () => {
    expect(publicationLabel("2026-09-03", false, "2026-09-03")).toBe(
      "Today's story",
    );
  });

  it("identifies yesterday", () => {
    expect(publicationLabel("2026-09-02", false, "2026-09-03")).toBe(
      "Published yesterday",
    );
  });

  it("formats older and previous-year dates", () => {
    expect(publicationLabel("2026-08-27", false, "2026-09-03")).toBe(
      "Published Aug 27",
    );
    expect(publicationLabel("2025-12-31", false, "2026-09-03")).toBe(
      "Published Dec 31, 2025",
    );
  });

  it("labels sample and malformed content safely", () => {
    expect(publicationLabel("2026-09-03", true, "2026-09-03")).toBe(
      "Sample story",
    );
    expect(publicationLabel("bad", false, "2026-09-03")).toBe(
      "Featured story",
    );
  });
});