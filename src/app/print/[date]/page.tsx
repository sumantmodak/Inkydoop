import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { getServedPack } from "@/lib/store/read";

export const dynamic = "force-dynamic";

// Print-optimized worksheet: story + vocabulary + questions, with the answer
// key on its own page (§3.5 / M8). No interactivity — built for paper/PDF.
export default async function PrintPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  const { pack, meta } = await getServedPack(validDate);
  const { story, vocabulary, questions } = pack;

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-black print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/story?date=${meta.servedDate}`}
          className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          ← Back to story
        </Link>
        <PrintButton />
      </div>

      <header className="border-b-2 border-black/10 pb-4">
        <p className="text-xs tracking-wide text-black/50 uppercase">
          Inkydoop · Daily Reading · {meta.servedDate}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{story.title}</h1>
        <p className="mt-1 text-sm text-black/60 capitalize">
          {story.genre} · {story.readingTimeMin} min read
        </p>
        <p className="mt-3 text-sm text-black/70">
          Name: <span className="inline-block w-48 border-b border-black/40" />
          &nbsp;&nbsp;&nbsp;Date:{" "}
          <span className="inline-block w-28 border-b border-black/40" />
        </p>
      </header>

      <section className="mt-6">
        <h2 className="text-xl font-bold">Story</h2>
        <div className="mt-2 space-y-3 leading-relaxed">
          {story.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Vocabulary</h2>
        <ul className="mt-2 space-y-3">
          {vocabulary.map((v) => (
            <li key={v.word} className="break-inside-avoid">
              <span className="font-bold">{v.word}</span>{" "}
              <span className="text-sm text-black/60 italic">({v.pos})</span> —{" "}
              {v.definition}
              <div className="text-sm text-black/70">
                e.g. &ldquo;{v.exampleFromStory}&rdquo;
              </div>
              {(v.synonyms.length > 0 || v.antonyms.length > 0) && (
                <div className="text-xs text-black/60">
                  {v.synonyms.length > 0 && (
                    <>Synonyms: {v.synonyms.join(", ")}. </>
                  )}
                  {v.antonyms.length > 0 && (
                    <>Antonyms: {v.antonyms.join(", ")}.</>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Comprehension Questions</h2>
        <ol className="mt-2 list-decimal space-y-4 pl-5">
          {questions.map((q) => (
            <li key={q.id} className="break-inside-avoid">
              <p className="font-medium">{q.question}</p>
              {q.choices && q.choices.length > 0 ? (
                <ul className="mt-1 list-[upper-alpha] space-y-0.5 pl-5 text-sm">
                  {q.choices.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 space-y-4">
                  <div className="border-b border-dashed border-black/30" />
                  <div className="border-b border-dashed border-black/30" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 break-before-page">
        <h2 className="text-xl font-bold">Answer Key</h2>
        <ol className="mt-2 list-decimal space-y-3 pl-5">
          {questions.map((q) => (
            <li key={q.id} className="break-inside-avoid">
              <span className="font-semibold">{q.answer}</span>
              {q.explanation && (
                <p className="text-sm text-black/70">{q.explanation}</p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-10 border-t border-black/10 pt-3 text-center text-xs text-black/50 print:mt-6">
        Inkydoop · inkydoop.com
      </footer>
    </div>
  );
}
