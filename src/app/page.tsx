import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { FALLBACK_FRONT_PAGE } from "@/lib/fallback";

export default function Home() {
  const { wordOfTheDay, interestingSentences } = FALLBACK_FRONT_PAGE;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            inkydoop
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            A fresh word, story, and reading practice every day.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-col gap-8">
        <section
          aria-labelledby="wotd-heading"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/50 dark:bg-amber-950/30"
        >
          <h2
            id="wotd-heading"
            className="text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-400"
          >
            Word of the Day
          </h2>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-bold">{wordOfTheDay.word}</span>
            <span className="text-slate-500 dark:text-slate-400">
              {wordOfTheDay.pronunciation}
            </span>
            <span className="text-sm text-slate-500 italic dark:text-slate-400">
              {wordOfTheDay.pos}
            </span>
          </p>
          <p className="mt-3 text-lg">{wordOfTheDay.definition}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
            {wordOfTheDay.examples.map((example, i) => (
              <li key={i}>{example}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="sentences-heading">
          <h2
            id="sentences-heading"
            className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
          >
            Interesting Sentences
          </h2>
          <ul className="mt-3 flex flex-col gap-3">
            {interestingSentences.map((sentence, i) => (
              <li
                key={i}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/50"
              >
                <span className="text-lg">{sentence.text}</span>
                <span className="w-fit rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                  {sentence.tag}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="story-heading">
          <h2
            id="story-heading"
            className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400"
          >
            Today&apos;s Story
          </h2>
          <Link
            href="/story"
            className="mt-3 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-sky-300 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-sky-700"
          >
            <div
              aria-hidden="true"
              className="h-32 w-full shrink-0 rounded-xl bg-gradient-to-br from-sky-200 to-violet-200 sm:w-48 dark:from-sky-900 dark:to-violet-900"
            />
            <div>
              <p className="text-xl font-semibold">Read today&apos;s story</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                A brand-new illustrated story with vocabulary and questions.
              </p>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
