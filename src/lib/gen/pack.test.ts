/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateAndStore } from "./pack";
import { generateStory } from "./story";
import { generateLearningMaterials } from "./learning";
import { renderImages } from "./images";
import { generateNarration } from "./audio";
import { insertPack } from "@/lib/store/tableStore";
import type { GeneratedStory, ProviderCall } from "@/lib/schemas";
import { GENERATION_PRESETS } from "@/lib/generation-models";

vi.mock("@/lib/env", () => ({
  env: {
    APP_VERSION: "test-version",
  },
}));

vi.mock("./seed", () => ({
  createStorySeed: () => ({ genre: "mystery", theme: "curiosity" }),
}));
vi.mock("./story", () => ({ generateStory: vi.fn() }));
vi.mock("./learning", () => ({ generateLearningMaterials: vi.fn() }));
vi.mock("./images", () => ({ renderImages: vi.fn() }));
vi.mock("./audio", () => ({ generateNarration: vi.fn() }));
vi.mock("@/lib/store/tableStore", () => ({
  newPackId: () => "pack-id",
  insertPack: vi.fn(),
}));

const generatedStory: GeneratedStory = {
  title: "The Lantern",
  hook: "A lantern reveals a secret path.",
  genre: "mystery",
  theme: "curiosity",
  paragraphs: ["Maya found a lantern in the attic."],
  candidateVocab: ["lantern"],
  artDirection: {
    style: "watercolor",
    characters: [{ name: "Maya", look: "curly hair" }],
    setting: "an attic",
  },
  images: [
    {
      role: "cover",
      afterParagraph: -1,
      prompt: "Maya finds the lantern.",
      alt: "Maya with a lantern",
    },
  ],
};

function providerCall(
  step: string,
  status: ProviderCall["status"],
  totalTokens: number,
  costUsd: number,
): ProviderCall {
  return {
    step,
    attempt: 1,
    model: `${step}-model`,
    startedAt: "2026-09-01T00:00:00.000Z",
    durationMs: 10,
    status,
    promptTokens: totalTokens / 2,
    completionTokens: totalTokens / 2,
    totalTokens,
    costUsd,
  };
}

describe("generateAndStore metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateStory).mockImplementation(
      async (_seed, _tier, options) => {
        options.telemetry?.prompts.push({
          step: "story",
          attempt: 1,
          model: "story-model",
          system: "story system",
          user: "story user",
        });
        options.telemetry?.calls.push(
          providerCall("story", "invalid_response", 20, 0.001),
          providerCall("story", "succeeded", 100, 0.01),
        );
        options.telemetry?.storyAttempts.push(
          {
            attempt: 1,
            wordCount: 5,
            readingGrade: 8,
            issues: ["reading_level: too difficult"],
          },
          {
            attempt: 2,
            wordCount: 7,
            readingGrade: 4,
            issues: [],
          },
        );
        return generatedStory;
      },
    );
    vi.mocked(generateLearningMaterials).mockImplementation(
      async (_input, _tier, options) => {
        if (options.telemetry) {
          options.telemetry.prompts.push({
            step: "learning",
            attempt: 1,
            model: "learning-model",
            system: "learning system",
            user: "learning user",
          });
          options.telemetry.calls.push(
            providerCall("learning", "succeeded", 200, 0.02),
          );
          options.telemetry.learningAttempts = 2;
          options.telemetry.validVocabularyItems = 5;
          options.telemetry.validQuestions = 5;
        }
        return { vocabulary: [], questions: [] };
      },
    );
    vi.mocked(renderImages).mockImplementation(async (_story, _id, options) => {
      options.telemetry?.prompts.push({
        step: "image",
        attempt: 1,
        model: "image-model",
        label: "Cover",
        user: "image prompt",
      });
      options.telemetry?.images.push({
        role: "cover",
        status: "succeeded",
        model: "image-model",
        requestedAspectRatio: "16:9",
        requestedFormat: "webp",
        moderationStatus: "not_run",
        blobPath: "pack-id/cover.webp",
        format: "webp",
        width: 1600,
        height: 900,
        bytes: 100,
        durationMs: 20,
        costUsd: 0.03,
      });
      return [
        {
          role: "cover",
          afterParagraph: -1,
          alt: "Maya with a lantern",
          blobPath: "pack-id/cover.webp",
        },
      ];
    });
    vi.mocked(generateNarration).mockImplementation(
      async (_story, _id, options) => {
        const narration = {
          blobPath: "pack-id/narration.mp3",
          model: options.narration.model,
          voice: options.narration.voice,
          format: "mp3" as const,
          bytes: 200,
          durationMs: 30,
          generationId: "audio-1",
          costUsd: 0.005,
          estimatedCostUsd: 0.006,
        };
        if (options.telemetry) {
          options.telemetry.audio = {
            status: "succeeded",
            moderationStatus: "not_run",
            ...narration,
            inputCharacters: 40,
          };
        }
        return narration;
      },
    );
  });

  it("stores and returns rolled-up generation telemetry", async () => {
    const result = await generateAndStore({
      date: "2026-09-01",
      tier: "growing",
      models: GENERATION_PRESETS.balanced.models,
    });

    const storedPack = vi.mocked(insertPack).mock.calls[0][3];
    expect(storedPack.generation).toMatchObject({
      schemaVersion: 1,
      status: "succeeded",
      appVersion: "test-version",
      promptVersion: "1",
      selection: { genre: "mystery", theme: "curiosity", tier: "growing" },
      models: GENERATION_PRESETS.balanced.models,
      tokens: { prompt: 160, completion: 160, total: 320 },
      costUsd: 0.061,
      costs: { textUsd: 0.031, imagesUsd: 0.03, totalUsd: 0.061 },
      retries: { story: 1, learning: 1, invalidJson: 1 },
      validation: {
        validVocabularyItems: 5,
        validQuestions: 5,
      },
      images: {
        requested: 1,
        succeeded: 1,
        failed: 0,
        totalBytes: 100,
      },
    });
    expect(result.metadata).toMatchObject({
      tokens: { total: 320 },
      costUsd: 0.061,
      costs: { textUsd: 0.031, imagesUsd: 0.03, totalUsd: 0.061 },
      retries: { story: 1, learning: 1, invalidJson: 1 },
      images: { requested: 1, succeeded: 1, failed: 0, totalBytes: 100 },
    });
    expect(generateNarration).not.toHaveBeenCalled();
  });

  it("adds narration only when requested", async () => {
    const narration = {
      model: "microsoft/mai-voice-2-flash" as const,
      voice: "en-US-Harper:MAI-Voice-2" as const,
    };
    const result = await generateAndStore({
      date: "2026-09-01",
      tier: "growing",
      models: GENERATION_PRESETS.balanced.models,
      narration,
    });

    expect(generateNarration).toHaveBeenCalledWith(
      expect.objectContaining({ title: "The Lantern" }),
      "pack-id",
      expect.objectContaining({ narration }),
    );
    const storedPack = vi.mocked(insertPack).mock.calls[0][3];
    expect(storedPack.story.narration).toMatchObject({
      blobPath: "pack-id/narration.mp3",
      model: narration.model,
      format: "mp3",
    });
    expect(result.metadata.audio).toMatchObject({ status: "succeeded" });
    expect(storedPack.generation?.costs).toMatchObject({
      textUsd: 0.031,
      imagesUsd: 0.03,
      totalUsd: 0.061,
      audioUsd: 0.005,
      totalWithAudioUsd: 0.066,
      audioEstimatedUsd: undefined,
      estimatedTotalUsd: undefined,
    });
  });
});
