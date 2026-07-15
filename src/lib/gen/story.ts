import { z } from "zod";
import { env } from "@/lib/env";
import { chatJson, type ChatMessage } from "@/lib/ai/openrouter";
import {
  StoryDraftSchema,
  GeneratedStorySchema,
  ImageSpecSchema,
  type GeneratedStory,
  type StoryDraft,
  type ImageSpec,
} from "@/lib/schemas";
import type { DaySeed } from "./seed";
import {
  TARGET_WORD_COUNT,
  MIN_WORDS,
  MAX_WORDS,
  MIN_GRADE,
  MAX_GRADE,
  countWords,
  validateStory,
  type StoryIssue,
} from "./validators";

const MAX_ATTEMPTS = 3; // 1 initial + 2 corrective retries

const SYSTEM_PROMPT = `You write daily reading stories for elementary students in grades 3-5 (Lexile 500-800).
Rules:
- LENGTH IS A HARD LIMIT: the story MUST be between ${MIN_WORDS} and ${MAX_WORDS} words total (aim for ${TARGET_WORD_COUNT}). Never exceed ${MAX_WORDS} words. Count the words and trim before returning.
- Short paragraphs, simple sentences, Tier 1-2 vocabulary.
- Engaging and age-appropriate. No violence, scary content, romance, profanity, or politics.
- You are also the art director: define a consistent visual style and character looks, then write 3 illustration prompts (1 cover + 2 scenes) that reuse those exact descriptions. Each scene's afterParagraph is the 0-based index of the paragraph it follows; the cover uses -1.
Return only JSON with this shape:
{
  "title": string,
  "genre": string,
  "theme": string,
  "paragraphs": string[],
  "candidateVocab": string[],
  "artDirection": { "style": string, "characters": [{ "name": string, "look": string }], "setting": string },
  "images": [{ "role": "cover"|"scene", "afterParagraph": number, "prompt": string, "alt": string }]
}`;

function buildUserPrompt(seed: DaySeed, corrective: string): string {
  const lines = [
    `Genre: ${seed.genre}`,
    `Theme: ${seed.theme}`,
    `Setting: ${seed.setting}`,
  ];
  if (corrective) lines.push(`\nRevision note: ${corrective}`);
  return lines.join("\n");
}

const ImageSpecsSchema = z.object({ images: z.array(ImageSpecSchema) });

/** Fallback: regenerate just the illustration specs from a finished draft. */
async function regenerateImageSpecs(
  draft: StoryDraft,
  signal?: AbortSignal,
): Promise<ImageSpec[]> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are an art director. Given a story and its visual style, write 3 illustration prompts (1 cover + 2 scenes) that reuse the character looks exactly. Return JSON { images: [{ role, afterParagraph, prompt, alt }] }.",
    },
    {
      role: "user",
      content: JSON.stringify({
        artDirection: draft.artDirection,
        paragraphs: draft.paragraphs,
      }),
    },
  ];
  const { images } = await chatJson(
    env.OPENROUTER_MODEL_QUIZ,
    messages,
    ImageSpecsSchema,
    { signal },
  );
  return images;
}

function correctionFor(story: GeneratedStory, issues: StoryIssue[]): string {
  return issues
    .map((issue) => {
      switch (issue.kind) {
        case "word_count": {
          const words = countWords(story.paragraphs);
          const dir =
            words > MAX_WORDS
              ? `shorten it by about ${words - TARGET_WORD_COUNT} words`
              : `expand it by about ${TARGET_WORD_COUNT - words} words`;
          return `Your previous draft was ${words} words, which is not allowed. The story MUST be between ${MIN_WORDS} and ${MAX_WORDS} words (aim for ${TARGET_WORD_COUNT}); ${dir} while keeping the same plot.`;
        }
        case "reading_level":
          return `Adjust reading difficulty to grades 3-5 (Flesch-Kincaid ${MIN_GRADE}-${MAX_GRADE}).`;
        case "safety":
          return "Remove any unsafe or inappropriate content.";
        case "structure":
          return "Include exactly one cover image and at least one scene image.";
      }
    })
    .join(" ");
}

export interface GenerateStoryOptions {
  signal?: AbortSignal;
}

/**
 * Generate one validated story for a seeded day (§6.1 Step 1). Retries with a
 * corrective note when validators fail; regenerates only the image specs when
 * the draft omits them.
 */
export async function generateStory(
  seed: DaySeed,
  options: GenerateStoryOptions = {},
): Promise<GeneratedStory> {
  const { signal } = options;
  let corrective = "";
  let lastIssues: StoryIssue[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const draft = await chatJson(
      env.OPENROUTER_MODEL_STORY,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(seed, corrective) },
      ],
      StoryDraftSchema,
      { temperature: 0.8, signal },
    );

    const images =
      draft.images && draft.images.length > 0
        ? draft.images
        : await regenerateImageSpecs(draft, signal);

    const story = GeneratedStorySchema.parse({ ...draft, images });
    const issues = validateStory(story);
    if (issues.length === 0) return story;

    lastIssues = issues;
    corrective = correctionFor(story, issues);
  }

  throw new Error(
    `Story generation failed after ${MAX_ATTEMPTS} attempts: ${lastIssues
      .map((i) => i.message)
      .join("; ")}`,
  );
}
