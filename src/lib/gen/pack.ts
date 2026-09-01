import type { DailyPack, Story, TierId } from "@/lib/schemas";
import { seedForDate } from "./seed";
import { generateStory } from "./story";
import { generateVocabulary } from "./vocab";
import { generateQuestions } from "./quiz";
import { renderImages } from "./images";
import { countWords, checkSafety } from "./validators";
import { TIERS } from "./tiers";
import { insertPack, newPackId } from "@/lib/store/tableStore";

export interface GenerateResult {
  id: string;
  date: string;
  tier: TierId;
  generated: boolean;
  durationMs: number;
}

/** Run the full daily generation pipeline and persist the pack (§6.1 Step 5). */
export async function generateAndStore(input: {
  date: string;
  tier: TierId;
  signal?: AbortSignal;
}): Promise<GenerateResult> {
  const { date, tier: tierId, signal } = input;
  const tier = TIERS[tierId];
  const start = Date.now();
  const id = newPackId(date);
  const seed = seedForDate(date);
  const gen = await generateStory(seed, tier, { signal });
  const vocabulary = await generateVocabulary(
    { paragraphs: gen.paragraphs, candidateVocab: gen.candidateVocab },
    tier,
    { signal },
  );
  const questions = await generateQuestions(
    { paragraphs: gen.paragraphs, vocabulary },
    tier,
    { signal },
  );

  // Render illustrations (non-blocking: failures yield fewer/no images).
  // Namespaced by the pack id so same-date stories don't overwrite images.
  const images = await renderImages(gen, id, { signal });

  const story: Story = {
    title: gen.title,
    genre: gen.genre,
    theme: gen.theme,
    paragraphs: gen.paragraphs,
    readingTimeMin: Math.ceil(countWords(gen.paragraphs) / 150),
    targetWords: gen.candidateVocab,
    artDirection: gen.artDirection,
    images,
  };

  const pack: DailyPack = {
    date,
    tier: tierId,
    story,
    vocabulary,
    questions,
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

  await insertPack(id, date, tierId, pack);
  return {
    id,
    date,
    tier: tierId,
    generated: true,
    durationMs: Date.now() - start,
  };
}
