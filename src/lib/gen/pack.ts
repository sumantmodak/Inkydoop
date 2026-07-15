import type { DailyPack, Story } from "@/lib/schemas";
import { seedForDate } from "./seed";
import { generateStory } from "./story";
import { generateVocabulary } from "./vocab";
import { generateQuestions } from "./quiz";
import { generateFrontPage } from "./frontpage";
import { countWords, checkSafety } from "./validators";
import { getPack, upsertPack } from "@/lib/store/tableStore";

export interface GenerateResult {
  date: string;
  generated: boolean;
  reason?: string;
  durationMs: number;
}

/** Run the full daily generation pipeline and persist the pack (§6.1 Step 5). */
export async function generateAndStore(input: {
  date: string;
  force: boolean;
  signal?: AbortSignal;
}): Promise<GenerateResult> {
  const { date, force, signal } = input;
  const start = Date.now();

  if (!force) {
    const existing = await getPack(date);
    if (existing) {
      return {
        date,
        generated: false,
        reason: "exists",
        durationMs: Date.now() - start,
      };
    }
  }

  const seed = seedForDate(date);
  const gen = await generateStory(seed, { signal });
  const vocabulary = await generateVocabulary(
    { paragraphs: gen.paragraphs, candidateVocab: gen.candidateVocab },
    { signal },
  );
  const questions = await generateQuestions(
    { paragraphs: gen.paragraphs, vocabulary },
    { signal },
  );
  const frontPage = await generateFrontPage({ signal });

  const story: Story = {
    title: gen.title,
    genre: gen.genre,
    theme: gen.theme,
    paragraphs: gen.paragraphs,
    readingTimeMin: Math.ceil(countWords(gen.paragraphs) / 150),
    targetWords: gen.candidateVocab,
    artDirection: gen.artDirection,
    images: [], // M6.5 renders and fills these
  };

  const pack: DailyPack = {
    date,
    wordOfTheDay: frontPage.wordOfTheDay,
    interestingSentences: frontPage.interestingSentences,
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

  await upsertPack(date, pack);
  return { date, generated: true, durationMs: Date.now() - start };
}
