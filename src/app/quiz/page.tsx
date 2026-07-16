import Link from "next/link";
import { QuizClient, type PublicQuestion } from "@/components/quiz-client";
import { getServedPack } from "@/lib/store/read";

export const dynamic = "force-dynamic";

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const { pack, id: packId } = await getServedPack(id);
  // Strip the rubric before sending questions to the client.
  const questions: PublicQuestion[] = pack.questions.map((q) => ({
    id: q.id,
    type: q.type,
    question: q.question,
    choices: q.choices,
    answer: q.answer,
    explanation: q.explanation,
  }));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <Link
        href={`/vocabulary?id=${packId}`}
        className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
      >
        ← Vocabulary
      </Link>

      <h1 className="font-display mt-5 text-3xl font-bold text-brand sm:text-4xl">
        Comprehension
      </h1>
      <p className="mt-1 text-muted">Answer the questions about the story.</p>

      <div className="mt-6">
        <QuizClient questions={questions} packId={packId} />
      </div>
    </div>
  );
}
