import { z } from "zod";
import { chatJson, type ChatMessage } from "@/lib/ai/openrouter";
import {
  StoryDraftSchema,
  GeneratedStorySchema,
  ImageSpecSchema,
  type GeneratedStory,
  type StoryDraft,
  type ImageSpec,
} from "@/lib/schemas";
import type { StorySeed } from "./seed";
import {
  countWords,
  readingGrade,
  validateStory,
  type StoryIssue,
} from "./validators";
import type { Tier } from "./tiers";
import type { GenerationTelemetry } from "./telemetry";
import { storySystem, IMAGE_SPECS_SYSTEM } from "@/lib/prompts";
import type { GenerationModels } from "@/lib/generation-models";

const MAX_ATTEMPTS = 3; // 1 initial + 2 corrective retries

function buildUserPrompt(seed: StorySeed, corrective: string): string {
  const lines = [
    `Genre: ${seed.genre}`,
    `Theme: ${seed.theme}`,
    `Setting: invent a fresh, imaginative setting that fits this genre and theme. Don't default to the obvious — surprise the reader with a specific, vivid place.`,
  ];
  if (corrective) lines.push(`\nRevision note: ${corrective}`);
  return lines.join("\n");
}

const ImageSpecsSchema = z.object({ images: z.array(ImageSpecSchema) });

/** Fallback: regenerate just the illustration specs from a finished draft. */
async function regenerateImageSpecs(
  draft: StoryDraft,
  models: GenerationModels,
  signal?: AbortSignal,
  telemetry?: GenerationTelemetry,
): Promise<ImageSpec[]> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: IMAGE_SPECS_SYSTEM,
    },
    {
      role: "user",
      content: JSON.stringify({
        artDirection: draft.artDirection,
        paragraphs: draft.paragraphs,
      }),
    },
  ];
  telemetry?.prompts.push({
    step: "image_specs",
    attempt: 1,
    model: models.learning,
    label: "Illustration planning",
    system: messages[0].content,
    user: messages[1].content,
  });
  const { images } = await chatJson(
    models.learning,
    messages,
    ImageSpecsSchema,
    {
      signal,
      step: "image_specs",
      onCall: telemetry ? (call) => telemetry.calls.push(call) : undefined,
    },
  );
  return images;
}

function correctionFor(
  story: GeneratedStory,
  issues: StoryIssue[],
  tier: Tier,
): string {
  return issues
    .map((issue) => {
      switch (issue.kind) {
        case "word_count": {
          const words = countWords(story.paragraphs);
          const dir =
            words > tier.maxWords
              ? `shorten it by about ${words - tier.targetWords} words`
              : `expand it by about ${tier.targetWords - words} words`;
          return `Your previous draft was ${words} words, which is not allowed. The story MUST be between ${tier.minWords} and ${tier.maxWords} words (aim for ${tier.targetWords}); ${dir} while keeping the same plot.`;
        }
        case "reading_level":
          return `Adjust reading difficulty to grades ${tier.grades} (Flesch-Kincaid ${tier.minGrade}-${tier.maxGrade}).`;
        case "safety":
          return "Remove any unsafe or inappropriate content.";
        case "structure":
          return "Include exactly one cover image and at least one scene image.";
      }
    })
    .join(" ");
}

export interface GenerateStoryOptions {
  models: GenerationModels;
  signal?: AbortSignal;
  telemetry?: GenerationTelemetry;
}

/**
 * Generate one validated story for a seeded day + tier (§6.1 Step 1). Retries
 * with a corrective note when validators fail; regenerates only the image specs
 * when the draft omits them.
 */
export async function generateStory(
  seed: StorySeed,
  tier: Tier,
  options: GenerateStoryOptions,
): Promise<GeneratedStory> {
  const { models, signal, telemetry } = options;
  let corrective = "";
  let lastIssues: StoryIssue[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const systemPrompt = storySystem(tier);
    const userPrompt = buildUserPrompt(seed, corrective);
    telemetry?.prompts.push({
      step: "story",
      attempt,
      model: models.story,
      system: systemPrompt,
      user: userPrompt,
    });
    const draft = await chatJson(
      models.story,
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      StoryDraftSchema,
      {
        temperature: 0.8,
        signal,
        step: "story",
        onCall: telemetry ? (call) => telemetry.calls.push(call) : undefined,
      },
    );

    const images =
      draft.images && draft.images.length > 0
        ? draft.images
        : await regenerateImageSpecs(draft, models, signal, telemetry);

    const story = GeneratedStorySchema.parse({ ...draft, images });
    const issues = validateStory(story, tier);
    telemetry?.storyAttempts.push({
      attempt,
      wordCount: countWords(story.paragraphs),
      readingGrade: readingGrade(story.paragraphs.join(" ")),
      issues: issues.map((issue) => `${issue.kind}: ${issue.message}`),
    });
    if (issues.length === 0) return story;

    lastIssues = issues;
    corrective = correctionFor(story, issues, tier);
  }

  throw new Error(
    `Story generation failed after ${MAX_ATTEMPTS} attempts: ${lastIssues
      .map((i) => i.message)
      .join("; ")}`,
  );
}
