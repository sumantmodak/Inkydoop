import type {
  GeneratedImageMeta,
  GenerationStep,
  ProviderCall,
  StoryValidationAttempt,
} from "@/lib/schemas";

export const GENERATION_SCHEMA_VERSION = 1 as const;
export const PROMPT_VERSION = "1";

export interface GenerationTelemetry {
  calls: ProviderCall[];
  durationsMsByStep: GenerationStep[];
  storyAttempts: StoryValidationAttempt[];
  learningAttempts: number;
  validVocabularyItems: number;
  validQuestions: number;
  images: GeneratedImageMeta[];
}

export function createGenerationTelemetry(): GenerationTelemetry {
  return {
    calls: [],
    durationsMsByStep: [],
    storyAttempts: [],
    learningAttempts: 0,
    validVocabularyItems: 0,
    validQuestions: 0,
    images: [],
  };
}

export async function measureStep<T>(
  telemetry: GenerationTelemetry,
  step: string,
  operation: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    return await operation();
  } finally {
    telemetry.durationsMsByStep.push({
      step,
      durationMs: Date.now() - start,
    });
  }
}
