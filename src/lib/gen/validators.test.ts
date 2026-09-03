import { describe, it, expect } from "vitest";
import {
  countWords,
  readingGrade,
  checkSafety,
  validateStory,
} from "@/lib/gen/validators";
import { TIERS } from "@/lib/gen/tiers";
import type { GeneratedStory } from "@/lib/schemas";

const GROWING = TIERS.growing;

describe("countWords", () => {
  it("counts words across paragraphs", () => {
    expect(countWords(["one two", "three four five"])).toBe(5);
  });
});

describe("readingGrade", () => {
  it("returns a low grade for short simple sentences", () => {
    const grade = readingGrade("The cat sat. The dog ran. We had fun.");
    expect(grade).toBeLessThan(6.5);
  });
});

describe("checkSafety", () => {
  it("flags banned words", () => {
    expect(checkSafety("someone had a gun").length).toBeGreaterThan(0);
  });

  it("passes clean text", () => {
    expect(checkSafety("a curious fox explored the forest")).toEqual([]);
  });
});

function storyWith(overrides: Partial<GeneratedStory>): GeneratedStory {
  return {
    title: "The Curious Fox",
    hook: "A fox finds a path no one else can see.",
    genre: "adventure",
    theme: "curiosity",
    paragraphs: ["A fox explored the forest."],
    candidateVocab: ["explored"],
    artDirection: {
      style: "soft watercolor",
      characters: [{ name: "Fox", look: "orange with white paws" }],
      setting: "a hidden forest",
    },
    images: [
      { role: "cover", afterParagraph: -1, prompt: "a fox", alt: "a fox" },
      { role: "scene", afterParagraph: 0, prompt: "fox in forest", alt: "fox" },
    ],
    ...overrides,
  };
}

describe("validateStory", () => {
  it("flags a too-short story", () => {
    const issues = validateStory(storyWith({}), GROWING);
    expect(issues.some((i) => i.kind === "word_count")).toBe(true);
  });

  it("flags unsafe content", () => {
    const issues = validateStory(storyWith({ title: "The Gun" }), GROWING);
    expect(issues.some((i) => i.kind === "safety")).toBe(true);
  });

  it("flags a missing cover", () => {
    const issues = validateStory(
      storyWith({
        images: [{ role: "scene", afterParagraph: 0, prompt: "x", alt: "x" }],
      }),
      GROWING,
    );
    expect(issues.some((i) => i.kind === "structure")).toBe(true);
  });

  it("passes a well-formed, long-enough story", () => {
    const sentence =
      "The little fox looked around the bright forest and smiled with joy. ";
    const paragraph = sentence.repeat(Math.ceil(GROWING.minWords / 12));
    const issues = validateStory(
      storyWith({ paragraphs: [paragraph] }),
      GROWING,
    );
    expect(issues).toEqual([]);
  });
});
