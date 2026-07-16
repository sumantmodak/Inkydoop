import { describe, it, expect } from "vitest";
import { DailyPackSchema, PackSummarySchema } from "@/lib/schemas";

const validPack = {
  date: "2026-07-15",
  wordOfTheDay: {
    word: "lantern",
    pos: "noun",
    pronunciation: "LAN-tern",
    definition: "a portable light with a protective case",
    examples: ["She carried a lantern into the cave."],
  },
  interestingSentences: [
    { text: "The fog swallowed the pier.", tag: "imagery" },
  ],
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
      title: "The Attic Light",
      genre: "mystery",
      theme: "curiosity",
      readingTimeMin: 7,
      coverBlobPath: null,
    };
    expect(() => PackSummarySchema.parse(summary)).not.toThrow();
  });
});
