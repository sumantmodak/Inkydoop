import { z } from "zod";
import { env } from "@/lib/env";
import { chatJson } from "@/lib/ai/openrouter";
import {
  WordOfTheDaySchema,
  InterestingSentenceSchema,
  type FrontPage,
} from "@/lib/schemas";
import { WOTD_SYSTEM, SENTENCES_SYSTEM } from "@/lib/prompts";

const SentencesResponseSchema = z.object({
  sentences: z.array(InterestingSentenceSchema),
});

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
