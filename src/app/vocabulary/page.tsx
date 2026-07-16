import Link from "next/link";
import { VocabQuiz, type VocabQuestion } from "@/components/vocab-quiz";
import { getServedPack } from "@/lib/store/read";
import type { VocabularyItem } from "@/lib/schemas";

export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(items: VocabularyItem[]): VocabQuestion[] {
  return items.map((item, i) => {
    const distractors = shuffle(items.filter((_, j) => j !== i))
      .slice(0, 3)
      .map((o) => o.definition);
    return {
      word: item.word,
      answer: item.definition,
      options: shuffle([item.definition, ...distractors]),
    };
  });
}

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const { pack, id: packId } = await getServedPack(id);
  const vocabulary = pack.vocabulary;
  const questions = buildQuestions(vocabulary);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <Link
        href={`/story?id=${packId}`}
        className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
      >
        ← Story
      </Link>

      <h1 className="font-display mt-5 text-3xl font-bold text-brand sm:text-4xl">
        Vocabulary
      </h1>
      <p className="mt-1 text-muted">Today&apos;s words from the story.</p>

      <ul className="mt-6 flex flex-col gap-3">
        {vocabulary.map((item) => (
          <li
            key={item.word}
            className="rounded-2xl border-2 border-surface-border bg-surface p-5 shadow-sm"
          >
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-display text-2xl font-bold text-brand">
                {item.word}
              </span>
              <span className="text-sm text-muted italic">{item.pos}</span>
            </p>
            <p className="mt-1 text-lg">{item.definition}</p>
            <p className="mt-2 text-foreground/70 italic">
              “{item.exampleFromStory}”
            </p>
            {(item.synonyms.length > 0 || item.antonyms.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.synonyms.map((s) => (
                  <span
                    key={`syn-${s}`}
                    className="rounded-full bg-mint/20 px-3 py-0.5 text-sm text-emerald-800 dark:text-emerald-200"
                  >
                    = {s}
                  </span>
                ))}
                {item.antonyms.map((a) => (
                  <span
                    key={`ant-${a}`}
                    className="rounded-full bg-coral/20 px-3 py-0.5 text-sm text-rose-800 dark:text-rose-200"
                  >
                    ≠ {a}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      <section aria-labelledby="quiz-heading" className="mt-10">
        <h2
          id="quiz-heading"
          className="font-display mb-3 text-xl font-bold text-brand"
        >
          Quick quiz
        </h2>
        <VocabQuiz questions={questions} />
      </section>

      <Link
        href={`/quiz?id=${packId}`}
        className="hover-pop mt-8 flex items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-brand to-grape p-5 text-white shadow-md focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none"
      >
        <span>
          <span className="font-display block text-lg font-bold">
            Comprehension quiz
          </span>
          <span className="text-white/85">Show what you understood.</span>
        </span>
        <span className="font-display shrink-0 rounded-full bg-white px-5 py-2 font-semibold text-brand">
          Start →
        </span>
      </Link>
    </div>
  );
}
