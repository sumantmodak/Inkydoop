/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { clampListLimit, entityToSummary } from "./tableStore";

describe("clampListLimit", () => {
  it("falls back to the default for missing or invalid input", () => {
    expect(clampListLimit()).toBe(12);
    expect(clampListLimit(0)).toBe(12);
    expect(clampListLimit(-5)).toBe(12);
    expect(clampListLimit(Number.NaN)).toBe(12);
  });

  it("clamps to the maximum page size", () => {
    expect(clampListLimit(1000)).toBe(50);
  });

  it("passes through valid limits (floored)", () => {
    expect(clampListLimit(20)).toBe(20);
    expect(clampListLimit(5.9)).toBe(5);
  });
});

describe("entityToSummary", () => {
  const base = {
    date: "2026-07-15",
    title: "The Sky Garden Promise",
    genre: "adventure",
    theme: "growth",
    readingTimeMin: 6,
  };

  it("maps metadata columns and treats an empty cover as null", () => {
    expect(entityToSummary({ ...base, coverBlobPath: "" })).toEqual({
      ...base,
      coverBlobPath: null,
    });
  });

  it("keeps a real cover path", () => {
    expect(
      entityToSummary({ ...base, coverBlobPath: "2026-07-15/cover.png" })
        .coverBlobPath,
    ).toBe("2026-07-15/cover.png");
  });
});
