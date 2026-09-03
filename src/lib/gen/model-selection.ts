import { env } from "@/lib/env";
import {
  GenerationModelsSchema,
  type GenerationModels,
} from "@/lib/generation-models";

export function resolveGenerationModels(
  requested?: GenerationModels,
): GenerationModels {
  return GenerationModelsSchema.parse(
    requested ?? {
      story: env.OPENROUTER_MODEL_STORY,
      learning: env.OPENROUTER_MODEL_LEARNING,
      image: env.IMAGE_MODEL,
    },
  );
}