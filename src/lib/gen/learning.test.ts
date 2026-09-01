/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chatJson } from "@/lib/ai/openrouter";
import { generateLearningMaterials } from "@/lib/gen/learning";
import { TIERS } from "@/lib/gen/tiers";

vi.mock("@/lib/env", () => ({
  env: { OPENROUTER_MODEL_LEARNING: "test-learning-model" },
}));

vi.mock("@/lib/ai/openrouter", () => ({ chatJson: vi.fn() }));

const vocabulary = {
  word: "lantern",
  pos: "noun",
  definition: "a portable light",
  exampleFromStory: "Maya found a lantern in the attic.",
  synonyms: ["lamp"],
  antonyms: [],
};

const question = {
  id: "q1",
  type: "literal" as const,
  question: "What did Maya find?",
  answer: "a lantern",
  explanation: "Maya found a lantern in the attic.",
  rubric: {
    mustInclude: ["lantern"],
    niceToHave: [],
    commonWrongPatterns: [],
  },
};

describe("generateLearningMaterials", () => {
  beforeEach(() => {
    vi.mocked(chatJson).mockReset();
  });

  it("generates vocabulary and questions in one model call", async () => {
    vi.mocked(chatJson).mockResolvedValue({
      vocabulary: [vocabulary],
      questions: [question],
    });

    const result = await generateLearningMaterials(
      {
        paragraphs: ["Maya found a lantern in the attic."],
        candidateVocab: ["lantern"],
      },
      TIERS.growing,
    );

    expect(chatJson).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      vocabulary: [vocabulary],
      questions: [question],
    });
  });
});