/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { filterVocabulary } from "@/lib/gen/learning";
import type { VocabularyItem } from "@/lib/schemas";

const story =
  "Maya climbed the creaky stairs to the attic. She found a lantern.";

function item(overrides: Partial<VocabularyItem>): VocabularyItem {
  return {
    word: "attic",
    pos: "noun",
    definition: "a room just below the roof",
    exampleFromStory: "Maya climbed the creaky stairs to the attic.",
    synonyms: [],
    antonyms: [],
    ...overrides,
  };
}

describe("filterVocabulary", () => {
  it("keeps items whose example is a substring of the story", () => {
    expect(filterVocabulary([item({})], story)).toHaveLength(1);
  });

  it("drops items whose example is not in the story", () => {
    const bad = item({ exampleFromStory: "She rode a dragon over the sea." });
    expect(filterVocabulary([bad], story)).toHaveLength(0);
  });

  it("dedupes repeated words case-insensitively", () => {
    const dupe = [item({ word: "attic" }), item({ word: "Attic" })];
    expect(filterVocabulary(dupe, story)).toHaveLength(1);
  });

  it("drops items with an overly long definition", () => {
    const long = item({ definition: "x".repeat(200) });
    expect(filterVocabulary([long], story)).toHaveLength(0);
  });
});
