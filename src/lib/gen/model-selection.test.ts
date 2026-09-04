/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { resolveGenerationModels } from "./model-selection";
import {
  GENERATION_PRESETS,
  GenerationModelsSchema,
  NarrationOptionsSchema,
} from "@/lib/generation-models";

vi.mock("@/lib/env", () => ({
  env: {
    OPENROUTER_MODEL_STORY: "z-ai/glm-5.2",
    OPENROUTER_MODEL_LEARNING: "deepseek/deepseek-v4-flash",
    IMAGE_MODEL: "google/gemini-2.5-flash-image",
  },
}));

describe("generation model selection", () => {
  it("accepts every curated preset", () => {
    for (const preset of Object.values(GENERATION_PRESETS)) {
      expect(GenerationModelsSchema.parse(preset.models)).toEqual(
        preset.models,
      );
    }
  });

  it("uses allowlisted environment defaults when no override is provided", () => {
    expect(resolveGenerationModels()).toEqual(
      GENERATION_PRESETS.balanced.models,
    );
  });

  it("rejects an arbitrary or category-mismatched model", () => {
    expect(() =>
      GenerationModelsSchema.parse({
        ...GENERATION_PRESETS.balanced.models,
        image: "z-ai/glm-5.2",
      }),
    ).toThrow();
  });

  it.each([
    "microsoft/mai-image-2.5",
    "microsoft/mai-image-2.6-flash",
    "microsoft/mai-image-2.6",
  ] as const)("accepts the Microsoft image model %s", (image) => {
    expect(
      GenerationModelsSchema.parse({
        story: "z-ai/glm-5.3",
        learning: "z-ai/glm-5.3-flash",
        image,
      }),
    ).toEqual({
      story: "z-ai/glm-5.3",
      learning: "z-ai/glm-5.3-flash",
      image,
    });
  });

  it("accepts only allowlisted speech model and voice combinations", () => {
    expect(
      NarrationOptionsSchema.parse({
        model: "microsoft/mai-voice-2-flash",
        voice: "en-US-Harper:MAI-Voice-2",
      }),
    ).toEqual({
      model: "microsoft/mai-voice-2-flash",
      voice: "en-US-Harper:MAI-Voice-2",
    });
    expect(() =>
      NarrationOptionsSchema.parse({
        model: "microsoft/mai-voice-2-flash",
        voice: "ara",
      }),
    ).toThrow();
  });
});
