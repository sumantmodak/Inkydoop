import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mascot } from "@/components/mascot";
import { FALLBACK_FRONT_PAGE } from "@/lib/fallback";

const SENTENCE_PILLS = [
  "bg-sunny/25 text-amber-800 dark:text-amber-200",
  "bg-sky/25 text-sky-800 dark:text-sky-200",
  "bg-mint/25 text-emerald-800 dark:text-emerald-200",
  "bg-coral/25 text-rose-800 dark:text-rose-200",
  "bg-grape/25 text-purple-800 dark:text-purple-200",
];

export default function Home() {
  const { wordOfTheDay, interestingSentences } = FALLBACK_FRONT_PAGE;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mascot className="hover-wiggle h-11 w-11" />
          <h1 className="font-display text-3xl font-bold text-brand sm:text-4xl">
            Inkydoop
          </h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-col gap-6">
        <Link
          href="/story"
          aria-label="Read today's story"
          className="hover-pop animate-pop-in group relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-grape p-6 text-white shadow-lg focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none sm:p-8"
        >
          <div className="relative z-10 flex items-center gap-5">
            <Mascot className="animate-float h-24 w-24 shrink-0 drop-shadow-lg sm:h-28 sm:w-28" />
            <div>
              <p className="font-display text-sm font-semibold tracking-wide text-white/80 uppercase">
                Today&apos;s Story
              </p>
              <h2 className="font-display mt-1 text-2xl font-bold sm:text-3xl">
                Ready for a new adventure?
              </h2>
              <p className="mt-1 text-white/85">
                A fresh illustrated story with vocabulary and questions.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 font-display font-semibold text-brand transition-transform group-hover:scale-105">
                Read it now →
              </span>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="absolute -right-8 -bottom-10 h-40 w-40 rounded-full bg-white/10"
          />
        </Link>

        <section
          aria-labelledby="wotd-heading"
          className="animate-pop-in rounded-3xl border-2 border-sunny/40 bg-surface p-6 shadow-sm"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex items-center gap-2">
            <StarIcon className="h-5 w-5 text-sunny" />
            <h2
              id="wotd-heading"
              className="font-display text-sm font-bold tracking-wide text-amber-700 uppercase dark:text-amber-300"
            >
              Word of the Day
            </h2>
          </div>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-4xl font-bold text-brand">
              {wordOfTheDay.word}
            </span>
            <span className="text-muted">{wordOfTheDay.pronunciation}</span>
            <span className="text-sm text-muted italic">
              {wordOfTheDay.pos}
            </span>
          </p>
          <p className="mt-3 text-lg">{wordOfTheDay.definition}</p>
          <ul className="mt-4 flex flex-col gap-2">
            {wordOfTheDay.examples.map((example, i) => (
              <li
                key={i}
                className="rounded-2xl bg-sunny/10 px-4 py-2 text-foreground/90"
              >
                {example}
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="sentences-heading"
          className="animate-pop-in"
          style={{ animationDelay: "160ms" }}
        >
          <h2
            id="sentences-heading"
            className="font-display mb-3 text-sm font-bold tracking-wide text-muted uppercase"
          >
            Sparkling Sentences
          </h2>
          <ul className="flex flex-col gap-3">
            {interestingSentences.map((sentence, i) => (
              <li
                key={i}
                className="hover-pop flex flex-col gap-2 rounded-2xl border-2 border-surface-border bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-lg">{sentence.text}</span>
                <span
                  className={`w-fit shrink-0 rounded-full px-3 py-1 font-display text-xs font-semibold ${
                    SENTENCE_PILLS[i % SENTENCE_PILLS.length]
                  }`}
                >
                  {sentence.tag}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="mt-10 text-center text-sm text-muted">
        Come back tomorrow for a brand-new story!
      </footer>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.8 6.1 20.8l1.2-6.6L2.5 9l6.6-.9z" />
    </svg>
  );
}
