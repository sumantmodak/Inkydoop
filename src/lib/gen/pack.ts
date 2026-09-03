import type { DailyPack, GenerationMeta, Story, TierId } from "@/lib/schemas";
import { env } from "@/lib/env";
import { createStorySeed } from "./seed";
import { generateStory } from "./story";
import { generateLearningMaterials } from "./learning";
import { renderImages } from "./images";
import { generateNarration } from "./audio";
import { countWords, checkSafety, readingGrade } from "./validators";
import { TIERS } from "./tiers";
import { insertPack, newPackId } from "@/lib/store/tableStore";
import {
  createGenerationTelemetry,
  GENERATION_SCHEMA_VERSION,
  measureStep,
  PROMPT_VERSION,
} from "./telemetry";
import type {
  GenerationModels,
  NarrationOptions,
} from "@/lib/generation-models";

export interface GenerateSummary {
  models: GenerationMeta["models"];
  tokens: GenerationMeta["tokens"];
  costUsd?: number;
  costs: NonNullable<GenerationMeta["costs"]>;
  retries: GenerationMeta["retries"];
  images: Pick<
    GenerationMeta["images"],
    "requested" | "succeeded" | "failed" | "totalBytes"
  >;
  audio?: GenerationMeta["audio"];
}

export interface GenerateResult {
  id: string;
  date: string;
  tier: TierId;
  generated: boolean;
  moderationStatus: "pending";
  durationMs: number;
  metadata: GenerateSummary;
}

function sumReportedCosts(costs: (number | undefined)[]): number | undefined {
  const reported = costs.filter((cost): cost is number => cost !== undefined);
  return reported.length
    ? reported.reduce((sum, cost) => sum + cost, 0)
    : undefined;
}

/** Run the full daily generation pipeline and persist the pack (§6.1 Step 5). */
export async function generateAndStore(input: {
  date: string;
  tier: TierId;
  models: GenerationModels;
  narration?: NarrationOptions;
  signal?: AbortSignal;
}): Promise<GenerateResult> {
  const { date, tier: tierId, models, narration, signal } = input;
  const tier = TIERS[tierId];
  const start = Date.now();
  const startedAt = new Date(start).toISOString();
  const id = newPackId(date);
  const selection = createStorySeed();
  const telemetry = createGenerationTelemetry();
  const gen = await measureStep(telemetry, "story", () =>
    generateStory(selection, tier, { models, signal, telemetry }),
  );
  const { vocabulary, questions } = await measureStep(
    telemetry,
    "learning",
    () =>
      generateLearningMaterials(
        { paragraphs: gen.paragraphs, candidateVocab: gen.candidateVocab },
        tier,
        { models, signal, telemetry },
      ),
  );

  // Render illustrations (non-blocking: failures yield fewer/no images).
  // Namespaced by the pack id so same-date stories don't overwrite images.
  const images = await measureStep(telemetry, "images", () =>
    renderImages(gen, id, { models, signal, telemetry }),
  );

  const assemblyStart = Date.now();
  const story: Story = {
    title: gen.title,
    hook: gen.hook,
    genre: gen.genre,
    theme: gen.theme,
    paragraphs: gen.paragraphs,
    readingTimeMin: Math.ceil(countWords(gen.paragraphs) / 150),
    targetWords: gen.candidateVocab,
    artDirection: gen.artDirection,
    images,
  };

  // Final safety pass over the assembled text (§6.1 Step 5).
  const flagged = checkSafety(
    [
      story.title,
      ...story.paragraphs,
      ...questions.map((q) => q.question),
    ].join(" "),
  );
  if (flagged.length > 0) {
    throw new Error(`Safety filter tripped: ${flagged.join(", ")}`);
  }

  if (narration) {
    const renderedNarration = await measureStep(telemetry, "audio", () =>
      generateNarration(story, id, { narration, signal, telemetry }),
    );
    if (renderedNarration) story.narration = renderedNarration;
  }
  telemetry.durationsMsByStep.push({
    step: "assembly",
    durationMs: Date.now() - assemblyStart,
  });

  const promptTokens = telemetry.calls.reduce(
    (sum, call) => sum + call.promptTokens,
    0,
  );
  const completionTokens = telemetry.calls.reduce(
    (sum, call) => sum + call.completionTokens,
    0,
  );
  const textCostUsd = sumReportedCosts(
    telemetry.calls.map((call) => call.costUsd),
  );
  const imagesCostUsd = sumReportedCosts(
    telemetry.images.map((image) => image.costUsd),
  );
  const totalCostUsd = sumReportedCosts([textCostUsd, imagesCostUsd]);
  const audioUsd = telemetry.audio?.costUsd;
  const totalWithAudioUsd =
    audioUsd === undefined
      ? undefined
      : sumReportedCosts([textCostUsd, imagesCostUsd, audioUsd]);
  const audioEstimatedUsd =
    audioUsd === undefined ? telemetry.audio?.estimatedCostUsd : undefined;
  const estimatedTotalUsd =
    audioEstimatedUsd === undefined
      ? undefined
      : sumReportedCosts([textCostUsd, imagesCostUsd, audioEstimatedUsd]);
  const imageSucceeded = telemetry.images.filter(
    (image) => image.status === "succeeded",
  ).length;
  const generation: GenerationMeta = {
    schemaVersion: GENERATION_SCHEMA_VERSION,
    status: "succeeded",
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    appVersion: env.APP_VERSION,
    promptVersion: PROMPT_VERSION,
    selection: { ...selection, tier: tierId },
    models: { ...models },
    prompts: telemetry.prompts,
    calls: telemetry.calls,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: telemetry.calls.reduce((sum, call) => sum + call.totalTokens, 0),
    },
    costUsd: totalCostUsd,
    costs: {
      textUsd: textCostUsd,
      imagesUsd: imagesCostUsd,
      totalUsd: totalCostUsd,
      audioUsd,
      totalWithAudioUsd,
      audioEstimatedUsd,
      estimatedTotalUsd,
    },
    durationsMsByStep: telemetry.durationsMsByStep,
    retries: {
      story: Math.max(0, telemetry.storyAttempts.length - 1),
      learning: Math.max(0, telemetry.learningAttempts - 1),
      invalidJson: telemetry.calls.filter(
        (call) => call.status === "invalid_response",
      ).length,
    },
    validation: {
      wordCount: countWords(story.paragraphs),
      readingGrade: readingGrade(story.paragraphs.join(" ")),
      storyAttempts: telemetry.storyAttempts,
      validVocabularyItems: telemetry.validVocabularyItems,
      validQuestions: telemetry.validQuestions,
    },
    images: {
      requested: gen.images.length,
      succeeded: imageSucceeded,
      failed: telemetry.images.length - imageSucceeded,
      totalBytes: telemetry.images.reduce(
        (sum, image) => sum + (image.bytes ?? 0),
        0,
      ),
      items: telemetry.images,
    },
    audio: telemetry.audio,
  };

  const pack: DailyPack = {
    date,
    tier: tierId,
    story,
    vocabulary,
    questions,
    generation,
  };

  await insertPack(id, date, tierId, pack);
  return {
    id,
    date,
    tier: tierId,
    generated: true,
    moderationStatus: "pending",
    durationMs: Date.now() - start,
    metadata: {
      models: generation.models,
      tokens: generation.tokens,
      costUsd: generation.costUsd,
      costs: generation.costs ?? {},
      retries: generation.retries,
      images: {
        requested: generation.images.requested,
        succeeded: generation.images.succeeded,
        failed: generation.images.failed,
        totalBytes: generation.images.totalBytes,
      },
      audio: generation.audio,
    },
  };
}
