/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import {
  clampListLimit,
  entityToSummary,
  moderationStatusOf,
  parsePack,
  serializePackForTable,
} from "./tableStore";
import { FALLBACK_PACK } from "@/lib/fallback";
import type { DailyPack, GenerationMeta } from "@/lib/schemas";

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
      hasNarration: false,
    });
  });

  it("keeps a real cover path", () => {
    expect(
      entityToSummary({ ...base, coverBlobPath: "2026-07-15/cover.png" })
        .coverBlobPath,
    ).toBe("2026-07-15/cover.png");
  });

  it("projects successful narration without loading packJson", () => {
    expect(
      entityToSummary({
        ...base,
        coverBlobPath: "",
        audioStatus: "succeeded",
      }).hasNarration,
    ).toBe(true);
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

const generationBase: GenerationMeta = {
  schemaVersion: 1,
  status: "succeeded",
  startedAt: "2026-09-01T00:00:00.000Z",
  finishedAt: "2026-09-01T00:01:00.000Z",
  durationMs: 60_000,
  appVersion: "test",
  promptVersion: "1",
  selection: { genre: "mystery", theme: "curiosity", tier: "growing" },
  models: {
    story: "story-model",
    learning: "learning-model",
    image: "image-model",
  },
  calls: [],
  tokens: { prompt: 0, completion: 0, total: 0 },
  durationsMsByStep: [],
  retries: { story: 0, learning: 0, invalidJson: 0 },
  validation: {
    wordCount: 100,
    readingGrade: 4,
    storyAttempts: [],
    validVocabularyItems: 5,
    validQuestions: 5,
  },
  images: { requested: 0, succeeded: 0, failed: 0, totalBytes: 0, items: [] },
};

describe("prompt storage columns", () => {
  it("removes prompts from packJson and restores them from numbered columns", () => {
    const systemPrompt = "s".repeat(12_000);
    const storyPrompt = "u".repeat(22_000);
    const imagePrompt = "i".repeat(22_000);
    const prompts: NonNullable<GenerationMeta["prompts"]> = [
      {
        step: "story",
        attempt: 1,
        model: "story-model",
        system: systemPrompt,
        user: storyPrompt,
      },
      {
        step: "image",
        attempt: 1,
        model: "image-model",
        label: "Cover",
        user: imagePrompt,
      },
    ];
    const pack: DailyPack = {
      ...FALLBACK_PACK,
      generation: { ...generationBase, prompts },
    };

    const stored = serializePackForTable(pack);

    expect(stored.packJson).not.toContain('"prompts"');
    expect(JSON.stringify(prompts).length).toBeGreaterThan(32 * 1024);
    expect(stored.promptColumns).toMatchObject({
      generationPromptCount: 2,
      generationPrompt01System: systemPrompt,
      generationPrompt01User: storyPrompt,
      generationPrompt02User: imagePrompt,
    });
    expect(
      parsePack({
        packJson: stored.packJson,
        ...stored.promptColumns,
      } as never).generation?.prompts,
    ).toEqual(prompts);
  });

  it("rejects a single prompt property above the Azure Table limit", () => {
    const pack: DailyPack = {
      ...FALLBACK_PACK,
      generation: {
        ...generationBase,
        prompts: [
          {
            step: "learning",
            attempt: 1,
            model: "learning-model",
            user: "x".repeat(32 * 1024 + 1),
          },
        ],
      },
    };

    expect(() => serializePackForTable(pack)).toThrow(
      "generationPrompt01User is 32,769 characters",
    );
  });
});
