import { describe, it, expect } from "vitest";
import { seedForDate } from "@/lib/gen/seed";

describe("seedForDate", () => {
  it("is deterministic for the same date", () => {
    expect(seedForDate("2026-07-15")).toEqual(seedForDate("2026-07-15"));
  });

  it("varies across dates", () => {
    const a = seedForDate("2026-07-15");
    const b = seedForDate("2026-08-01");
    expect(a).not.toEqual(b);
  });

  it("returns non-empty genre, theme, and setting", () => {
    const seed = seedForDate("2026-07-15");
    expect(seed.genre).toBeTruthy();
    expect(seed.theme).toBeTruthy();
    expect(seed.setting).toBeTruthy();
  });
});
