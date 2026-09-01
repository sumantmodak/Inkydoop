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

  it("returns non-empty genre and theme", () => {
    const seed = seedForDate("2026-07-15");
    expect(seed.genre).toBeTruthy();
    expect(seed.theme).toBeTruthy();
  });

  it("provides broad genre and theme variety across a year", () => {
    const seeds = Array.from({ length: 365 }, (_, day) => {
      const date = new Date(Date.UTC(2027, 0, day + 1));
      return seedForDate(date.toISOString().slice(0, 10));
    });
    const genres = new Set(seeds.map((seed) => seed.genre));
    const themes = new Set(seeds.map((seed) => seed.theme));

    expect(genres.size).toBeGreaterThanOrEqual(55);
    expect(themes.size).toBeGreaterThanOrEqual(70);
  });
});
