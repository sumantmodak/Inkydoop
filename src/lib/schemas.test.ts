import { describe, it, expect } from "vitest";
import {
  DailyPackSchema,
  GenerationMetaSchema,
  PackSummarySchema,
} from "@/lib/schemas";

const validPack = {
  date: "2026-07-15",
  story: {
    title: "The Attic Light",
    genre: "mystery",
    theme: "curiosity",
    paragraphs: ["Mia climbed to the attic.", "She lifted the dusty lantern."],
    readingTimeMin: 7,
    targetWords: ["lantern"],
    artDirection: {
      style: "soft watercolor",
      characters: [{ name: "Mia", look: "curly brown hair, red raincoat" }],
      setting: "a foggy seaside town",
    },
    images: [
      {
        role: "cover",
        afterParagraph: -1,
        alt: "Mia holding a lantern",
        blobPath: "2026-07-15/cover.webp",
      },
    ],
  },
  vocabulary: [
    {
      word: "lantern",
      pos: "noun",
      definition: "a portable light",
      exampleFromStory: "She lifted the dusty lantern.",
      synonyms: ["lamp"],
      antonyms: [],
    },
  ],
  questions: [
    {
      id: "q1",
      type: "literal",
      question: "Where did Mia go?",
      answer: "the attic",
      explanation: "Paragraph 1 says she climbed to the attic.",
      choices: ["the attic", "the cellar"],
      rubric: {
        mustInclude: ["attic"],
        niceToHave: [],
        commonWrongPatterns: ["cellar"],
      },
    },
  ],
};

describe("DailyPackSchema", () => {
  it("accepts a well-formed pack", () => {
    expect(() => DailyPackSchema.parse(validPack)).not.toThrow();
  });

  it("defaults the story hook for legacy packs", () => {
    expect(DailyPackSchema.parse(validPack).story.hook).toBe("");
  });

  it("rejects a malformed date", () => {
    expect(() =>
      DailyPackSchema.parse({ ...validPack, date: "07-15-2026" }),
    ).toThrow();
  });

  it("rejects an unknown question type", () => {
    const bad = {
      ...validPack,
      questions: [{ ...validPack.questions[0], type: "riddle" }],
    };
    expect(() => DailyPackSchema.parse(bad)).toThrow();
  });
});

describe("PackSummarySchema", () => {
  it("allows a null cover", () => {
    const summary = {
      id: "79739284-8200000000000-ab",
      date: "2026-07-15",
      tier: "growing",
      title: "The Attic Light",
      genre: "mystery",
      theme: "curiosity",
      readingTimeMin: 7,
      coverBlobPath: null,
    };
    expect(() => PackSummarySchema.parse(summary)).not.toThrow();
  });
});

describe("GenerationMetaSchema", () => {
  it("accepts complete generation telemetry", () => {
    const metadata = {
      schemaVersion: 1,
      status: "succeeded",
      startedAt: "2026-09-01T00:00:00.000Z",
      finishedAt: "2026-09-01T00:01:00.000Z",
      durationMs: 60_000,
      appVersion: "abc123",
      promptVersion: "1",
      selection: { genre: "mystery", theme: "curiosity", tier: "growing" },
      models: {
        story: "story-model",
        learning: "learning-model",
        image: "image-model",
      },
      calls: [],
      tokens: { prompt: 100, completion: 200, total: 300 },
      costUsd: 0.04,
      costs: { textUsd: 0.01, imagesUsd: 0.03, totalUsd: 0.04 },
      durationsMsByStep: [{ step: "story", durationMs: 20_000 }],
      retries: { story: 1, learning: 0, invalidJson: 0 },
      validation: {
        wordCount: 950,
        readingGrade: 4.2,
        storyAttempts: [
          {
            attempt: 1,
            wordCount: 950,
            readingGrade: 4.2,
            issues: [],
          },
        ],
        validVocabularyItems: 6,
        validQuestions: 6,
      },
      images: {
        requested: 3,
        succeeded: 3,
        failed: 0,
        totalBytes: 30_000,
        items: [],
      },
    };

    expect(() => GenerationMetaSchema.parse(metadata)).not.toThrow();
  });
});
