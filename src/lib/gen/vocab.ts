import { z } from "zod";
import { env } from "@/lib/env";
import { chatJson } from "@/lib/ai/openrouter";
import { VocabularyItemSchema, type VocabularyItem } from "@/lib/schemas";
import { vocabSystem } from "@/lib/prompts";
import type { Tier } from "./tiers";

const MAX_DEFINITION_CHARS = 140;
const MAX_WORDS = 10;

const VocabResponseSchema = z.object({
  vocabulary: z.array(VocabularyItemSchema),
});

/**
 * Keep only vocabulary items whose example is a real substring of the story,
 * whose definition is short enough, and drop duplicate words (§6.1 Step 2).
 */
export function filterVocabulary(
  items: VocabularyItem[],
  storyText: string,
): VocabularyItem[] {
  const text = storyText.toLowerCase();
  const seen = new Set<string>();
  const out: VocabularyItem[] = [];
  for (const item of items) {
    const key = item.word.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    if (item.definition.length > MAX_DEFINITION_CHARS) continue;
    if (!text.includes(item.exampleFromStory.toLowerCase())) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Extract vocabulary from a story (§6.1 Step 2). */
export async function generateVocabulary(
  input: { paragraphs: string[]; candidateVocab: string[] },
  tier: Tier,
  options: { signal?: AbortSignal } = {},
): Promise<VocabularyItem[]> {
  const storyText = input.paragraphs.join("\n\n");
  const user = `Candidate words (hint): ${input.candidateVocab.join(", ")}\n\nStory:\n${storyText}`;
  const { vocabulary } = await chatJson(
    env.OPENROUTER_MODEL_VOCAB,
    [
      { role: "system", content: vocabSystem(tier, MAX_DEFINITION_CHARS) },
      { role: "user", content: user },
    ],
    VocabResponseSchema,
    { signal: options.signal },
  );
  return filterVocabulary(vocabulary, storyText).slice(0, MAX_WORDS);
}
