import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mascot } from "@/components/mascot";
import { StoryImage } from "@/components/story-image";
import { getServedPack } from "@/lib/store/read";

export const dynamic = "force-dynamic";

const SENTENCE_PILLS = [
  "bg-sunny/25 text-amber-800 dark:text-amber-200",
  "bg-sky/25 text-sky-800 dark:text-sky-200",
  "bg-mint/25 text-emerald-800 dark:text-emerald-200",
  "bg-coral/25 text-rose-800 dark:text-rose-200",
  "bg-grape/25 text-purple-800 dark:text-purple-200",
];

const SENTENCE_SPANS = [
  "sm:col-span-3",
  "sm:col-span-3",
  "sm:col-span-2",
  "sm:col-span-4",
];

export default async function Home() {
  const { pack } = await getServedPack();
  const { wordOfTheDay, interestingSentences } = pack;
  const story = pack.story;
  const cover = story.images.find((img) => img.role === "cover");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mascot className="animate-bob h-14 w-14 sm:h-16 sm:w-16" />
          <h1 className="font-display text-3xl font-bold text-brand sm:text-4xl">
            Inkydoop
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/library"
            className="font-display rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
          >
            Library
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="grid grid-cols-1 gap-4 sm:grid-cols-6">
        <Link
          href="/story"
          aria-label={`Read today's story: ${story.title}`}
          className="hover-pop animate-pop-in group relative flex min-h-72 flex-col justify-end overflow-hidden rounded-3xl shadow-lg ring-4 ring-white focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none sm:col-span-6 sm:min-h-96 dark:ring-surface"
        >
          {cover ? (
            <StoryImage
              alt={cover.alt}
              blobPath={cover.blobPath}
              className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-brand to-grape"
            />
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
          />
          <Mascot className="animate-float absolute top-4 right-4 h-16 w-16 drop-shadow-lg sm:h-20 sm:w-20" />
          <div className="relative z-10 p-6 sm:p-8">
            <span className="font-display inline-block -rotate-2 rounded-full bg-sunny px-3 py-1 text-xs font-extrabold text-[#2b2d52] shadow-md">
              ✦ Today&apos;s Story
            </span>
            <h2 className="font-display mt-3 text-3xl font-bold text-white drop-shadow-md sm:text-4xl">
              {story.title}
            </h2>
            <p className="mt-1 max-w-md text-white/85">
              A fresh illustrated story with vocabulary and questions.
            </p>
            <span className="font-display mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 font-semibold text-brand transition-transform group-hover:scale-105">
              Read it now →
            </span>
          </div>
        </Link>

        <section
          aria-labelledby="wotd-heading"
          className="animate-pop-in rounded-3xl border-2 border-sunny/40 bg-surface p-6 shadow-sm sm:col-span-4"
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

        <aside
          className="animate-pop-in flex flex-col items-center justify-center gap-2 rounded-3xl bg-gradient-to-br from-mint/25 to-sky/25 p-5 text-center shadow-sm sm:col-span-2"
          style={{ animationDelay: "120ms" }}
        >
          <Mascot className="animate-float h-14 w-14" />
          <p className="font-display font-semibold text-brand">Tip!</p>
          <p className="text-sm text-foreground/80">
            Tap tricky words in the story to see what they mean.
          </p>
        </aside>

        <section aria-labelledby="sentences-heading" className="contents">
          <h2
            id="sentences-heading"
            className="font-display mt-2 text-sm font-bold tracking-wide text-muted uppercase sm:col-span-6"
          >
            Sparkling Sentences
          </h2>
          <ul className="contents">
            {interestingSentences.map((sentence, i) => (
              <li
                key={i}
                className={`hover-pop animate-pop-in flex flex-col gap-3 rounded-2xl border-2 border-surface-border bg-surface p-4 shadow-sm ${
                  SENTENCE_SPANS[i % SENTENCE_SPANS.length]
                }`}
                style={{ animationDelay: `${180 + i * 60}ms` }}
              >
                <span className="text-lg">{sentence.text}</span>
                <span
                  className={`w-fit rounded-full px-3 py-1 font-display text-xs font-semibold ${
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
