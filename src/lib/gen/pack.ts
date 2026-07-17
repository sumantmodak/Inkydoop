import type { DailyPack, Story } from "@/lib/schemas";
import { seedForDate } from "./seed";
import { generateStory } from "./story";
import { generateVocabulary } from "./vocab";
import { generateQuestions } from "./quiz";
import { generateFrontPage } from "./frontpage";
import { renderImages } from "./images";
import { countWords, checkSafety } from "./validators";
import { insertPack, newPackId } from "@/lib/store/tableStore";

export interface GenerateResult {
  id: string;
  date: string;
  generated: boolean;
  durationMs: number;
}

/** Run the full daily generation pipeline and persist the pack (§6.1 Step 5). */
export async function generateAndStore(input: {
  date: string;
  signal?: AbortSignal;
}): Promise<GenerateResult> {
  const { date, signal } = input;
  const start = Date.now();
  const id = newPackId(date);
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

  await insertPack(id, date, pack);
  return { id, date, generated: true, durationMs: Date.now() - start };
}
