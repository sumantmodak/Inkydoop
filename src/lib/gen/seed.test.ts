import { describe, it, expect } from "vitest";
import { createStorySeed } from "@/lib/gen/seed";

describe("createStorySeed", () => {
  it("returns non-empty genre and theme", () => {
    const seed = createStorySeed();
    expect(seed.genre).toBeTruthy();
    expect(seed.theme).toBeTruthy();
  });

  it("selects genre and theme independently", () => {
    const indices = [2, 3];
    const pickIndex = (maxExclusive: number) => {
      const index = indices.shift() ?? 0;
      expect(index).toBeLessThan(maxExclusive);
      return index;
    };

    expect(createStorySeed(pickIndex)).toEqual({
      genre: "detective story",
      theme: "kindness",
    });
  });
});
