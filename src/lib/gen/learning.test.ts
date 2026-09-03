/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { chatJson } from "@/lib/ai/openrouter";
import { generateLearningMaterials } from "@/lib/gen/learning";
import { TIERS } from "@/lib/gen/tiers";
import { GENERATION_PRESETS } from "@/lib/generation-models";
import { createGenerationTelemetry } from "@/lib/gen/telemetry";

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

const vocabularyItems = Array.from({ length: 5 }, (_, index) => ({
  ...vocabulary,
  word: `lantern${index}`,
}));

const questions = Array.from({ length: 5 }, (_, index) => ({
  ...question,
  id: `q${index + 1}`,
}));

describe("generateLearningMaterials", () => {
  beforeEach(() => {
    vi.mocked(chatJson).mockReset();
  });

  it("generates vocabulary and questions in one model call", async () => {
    vi.mocked(chatJson).mockResolvedValue({
      vocabulary: vocabularyItems,
      questions,
    });
    const telemetry = createGenerationTelemetry();

    const result = await generateLearningMaterials(
      {
        paragraphs: ["Maya found a lantern in the attic."],
        candidateVocab: ["lantern"],
      },
      TIERS.growing,
      { models: GENERATION_PRESETS.balanced.models, telemetry },
    );

    expect(chatJson).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      vocabulary: vocabularyItems,
      questions,
    });
    expect(telemetry.prompts).toEqual([
      {
        step: "learning",
        attempt: 1,
        model: GENERATION_PRESETS.balanced.models.learning,
        system: vi.mocked(chatJson).mock.calls[0][1][0].content,
        user: vi.mocked(chatJson).mock.calls[0][1][1].content,
      },
    ]);
  });

  it("retries when local validation leaves too few questions", async () => {
    vi.mocked(chatJson)
      .mockResolvedValueOnce({
        vocabulary: vocabularyItems,
        questions: [
          ...questions.slice(0, 4),
          {
            ...question,
            id: "q5",
            rubric: {
              mustInclude: [],
              niceToHave: [],
              commonWrongPatterns: [],
            },
          },
        ],
      })
      .mockResolvedValueOnce({ vocabulary: vocabularyItems, questions });

    const result = await generateLearningMaterials(
      {
        paragraphs: ["Maya found a lantern in the attic."],
        candidateVocab: ["lantern"],
      },
      TIERS.growing,
      { models: GENERATION_PRESETS.balanced.models },
    );

    expect(chatJson).toHaveBeenCalledTimes(2);
    expect(vi.mocked(chatJson).mock.calls[0][0]).toBe(
      "deepseek/deepseek-v4-flash",
    );
    expect(result.questions).toHaveLength(5);
    expect(vi.mocked(chatJson).mock.calls[1][1][1].content).toContain(
      "5 valid vocabulary items and 4 valid questions",
    );
  });

  it("keeps valid questions as open response when every choice set mismatches", async () => {
    vi.mocked(chatJson).mockResolvedValue({
      vocabulary: vocabularyItems,
      questions: questions.map((item) => ({
        ...item,
        choices: ["another answer", "something else"],
      })),
    });

    const result = await generateLearningMaterials(
      {
        paragraphs: ["Maya found a lantern in the attic."],
        candidateVocab: ["lantern"],
      },
      TIERS.growing,
      { models: GENERATION_PRESETS.balanced.models },
    );

    expect(chatJson).toHaveBeenCalledTimes(1);
    expect(result.questions).toHaveLength(5);
    expect(result.questions.every((item) => item.choices === undefined)).toBe(
      true,
    );
  });
});
