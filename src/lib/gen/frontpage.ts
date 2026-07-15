import { z } from "zod";
import { env } from "@/lib/env";
import { chatJson } from "@/lib/ai/openrouter";
import {
  WordOfTheDaySchema,
  InterestingSentenceSchema,
  type FrontPage,
} from "@/lib/schemas";

const SentencesResponseSchema = z.object({
  sentences: z.array(InterestingSentenceSchema),
});

const WOTD_SYSTEM = `Pick one Word of the Day for elementary students in grades 3-5. Age-appropriate and encouraging; no scary, violent, or adult content.
Return only JSON: { "word": string, "pos": string, "pronunciation": string, "definition": string, "examples": string[] } with 2-3 kid-friendly example sentences.`;

const SENTENCES_SYSTEM = `Write 3-5 vivid example sentences for elementary students in grades 3-5. Each sentence highlights one literary device, tagged as one of: metaphor, simile, alliteration, strong verb, imagery, personification. Age-appropriate; no scary, violent, or adult content.
Return only JSON: { "sentences": [{ "text": string, "tag": string }] }.`;

/** Generate the story-independent front-page content (§6.1 Step 4). */
export async function generateFrontPage(
  options: {
    signal?: AbortSignal;
  } = {},
): Promise<FrontPage> {
  const { signal } = options;
  const [wordOfTheDay, sentences] = await Promise.all([
    chatJson(
      env.OPENROUTER_MODEL_WOTD,
      [
        { role: "system", content: WOTD_SYSTEM },
        { role: "user", content: "Give today's Word of the Day." },
      ],
      WordOfTheDaySchema,
      { signal },
    ),
    chatJson(
      env.OPENROUTER_MODEL_WOTD,
      [
        { role: "system", content: SENTENCES_SYSTEM },
        { role: "user", content: "Give today's interesting sentences." },
      ],
      SentencesResponseSchema,
      { signal },
    ),
  ]);

  return { wordOfTheDay, interestingSentences: sentences.sentences };
}
