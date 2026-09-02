/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import {
  clampListLimit,
  entityToSummary,
  moderationStatusOf,
} from "./tableStore";

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
    rowKey: "79739284-8200000000000-ab",
    date: "2026-07-15",
    tier: "middle",
    title: "The Sky Garden Promise",
    genre: "adventure",
    theme: "growth",
    readingTimeMin: 6,
  };

  it("maps metadata columns, uses rowKey as id, and treats an empty cover as null", () => {
    expect(entityToSummary({ ...base, coverBlobPath: "" })).toEqual({
      id: "79739284-8200000000000-ab",
      date: "2026-07-15",
      tier: "middle",
      title: "The Sky Garden Promise",
      genre: "adventure",
      theme: "growth",
      readingTimeMin: 6,
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

describe("moderationStatusOf", () => {
  it("treats legacy rows without status as approved", () => {
    expect(moderationStatusOf({})).toBe("approved");
  });

  it("preserves known moderation states", () => {
    expect(moderationStatusOf({ moderationStatus: "pending" })).toBe("pending");
    expect(moderationStatusOf({ moderationStatus: "approved" })).toBe(
      "approved",
    );
    expect(moderationStatusOf({ moderationStatus: "rejected" })).toBe(
      "rejected",
    );
  });

  it("fails closed for an unknown status", () => {
    expect(moderationStatusOf({ moderationStatus: "unexpected" })).toBe(
      "pending",
    );
  });
});
