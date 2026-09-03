import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mascot } from "@/components/mascot";
import { StoryImage } from "@/components/story-image";
import { TierSelect } from "@/components/tier-select";
import { ShareButton } from "@/components/share-button";
import { SaveStoryButton } from "@/components/save-story-button";
import { getServedPack, todayUtc } from "@/lib/store/read";
import { listPacks } from "@/lib/store/tableStore";
import { getTierCookie } from "@/lib/tier-cookie";
import { TIERS } from "@/lib/gen/tiers";
import { publicationLabel } from "@/lib/publication-label";
import type { PackSummary, TierId } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const GENRES = [
  ["Adventure", "adventure"],
  ["Mystery", "mystery"],
  ["Fantasy", "fantasy"],
  ["Science fiction", "science fiction"],
  ["Friendship", "friendship story"],
  ["Folktale", "folktale or myth"],
] as const;

async function loadRecent(tier: TierId): Promise<PackSummary[]> {
  try {
    return (await listPacks({ limit: 7, tier })).items;
  } catch {
    return [];
  }
}

function storyHook(hook: string, firstParagraph: string): string {
  if (hook.trim()) return hook;
  const firstSentence = firstParagraph.match(/^.*?[.!?](?:\s|$)/)?.[0];
  return firstSentence?.trim() ?? firstParagraph;
}

export default async function Home() {
  const tier = await getTierCookie();
  const [{ pack, id: packId, date, isSample }, recentPacks] =
    await Promise.all([getServedPack(undefined, tier), loadRecent(tier)]);
  const story = pack.story;
  const cover = story.images.find((img) => img.role === "cover");
  const featuredLabel = publicationLabel(date, isSample, todayUtc());
  const recent = recentPacks.filter((item) => item.id !== packId).slice(0, 6);
  const exactStoryPath = `/story?id=${encodeURIComponent(packId)}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
        <div className="flex w-full items-center justify-between sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <Mascot className="animate-bob h-12 w-12 sm:h-16 sm:w-16" />
            <h1 className="font-display text-2xl font-bold text-brand sm:text-4xl">
              Inkydoop
            </h1>
          </div>
          <div className="sm:hidden">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end">
          <TierSelect current={tier} />
          <Link
            href="/library"
            className="font-display rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
          >
            Library
          </Link>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="space-y-12 sm:space-y-16">
        <section
          aria-labelledby="featured-title"
          className="animate-pop-in relative flex min-h-[28rem] flex-col justify-end overflow-hidden rounded-xl bg-[#20203a] shadow-xl ring-4 ring-white sm:min-h-[38rem] dark:ring-surface"
        >
          {cover ? (
            <StoryImage
              alt={cover.alt}
              blobPath={cover.blobPath}
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-brand to-grape"
            />
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/5"
          />
          <Mascot className="animate-float absolute top-5 right-5 hidden h-24 w-24 drop-shadow-lg sm:block" />
          <div className="relative z-10 max-w-4xl p-5 sm:p-10 lg:p-12">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-bold text-white/85 uppercase">
              <span className="font-display text-sunny">{featuredLabel}</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/50" />
              <span>{TIERS[pack.tier].label}</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/50" />
              <span className="capitalize">{story.genre}</span>
            </div>
            <h2
              id="featured-title"
              className="font-display mt-3 max-w-3xl text-3xl leading-[1.05] font-bold text-white drop-shadow-md sm:mt-4 sm:text-6xl lg:text-7xl"
            >
              {story.title}
            </h2>
            <p className="mt-3 line-clamp-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:mt-4 sm:line-clamp-none sm:text-xl">
              {storyHook(story.hook, story.paragraphs[0] ?? "")}
            </p>
            <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-y border-white/25 py-2.5 text-xs text-white/80 sm:mt-5 sm:gap-y-2 sm:py-3 sm:text-sm">
              <div className="flex gap-1.5">
                <dt className="sr-only">Theme</dt>
                <dd className="capitalize">{story.theme}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="font-semibold text-white">Read</dt>
                <dd>{story.readingTimeMin} min</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="font-semibold text-white">Inside</dt>
                <dd>{pack.vocabulary.length} words · {pack.questions.length} questions</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
              <Link
                href={exactStoryPath}
                className="font-display inline-flex min-h-12 items-center rounded-full bg-sunny px-7 py-2.5 font-bold text-[#2b2d52] shadow-md transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none"
              >
                Read the story&nbsp; →
              </Link>
              <span aria-hidden="true" className="hidden h-7 w-px bg-white/35 sm:block" />
              <SaveStoryButton packId={packId} />
              <ShareButton path={exactStoryPath} title={story.title} />
            </div>
          </div>
        </section>

        {recent.length > 0 && (
          <section aria-labelledby="recent-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="font-display text-xs font-bold tracking-wide text-brand uppercase">
                  More to explore
                </p>
                <h2 id="recent-heading" className="font-display mt-1 text-2xl font-bold sm:text-3xl">
                  Recently added
                </h2>
              </div>
              <Link href="/library" className="font-display text-sm font-semibold text-brand hover:underline">
                View library →
              </Link>
            </div>
            <ul className="flex snap-x gap-4 overflow-x-auto pb-4">
              {recent.map((item) => (
                <li key={item.id} className="w-44 shrink-0 snap-start sm:w-52">
                  <Link href={`/story?id=${encodeURIComponent(item.id)}`} className="group block">
                    <StoryImage
                      alt={`Cover for ${item.title}`}
                      blobPath={item.coverBlobPath ?? undefined}
                      className="aspect-[4/5] w-full rounded-xl shadow-md transition-transform duration-300 group-hover:-translate-y-1"
                    />
                    <h3 className="font-display mt-3 line-clamp-2 font-bold group-hover:text-brand">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted capitalize">
                      {item.genre} · {item.readingTimeMin} min
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="path-heading">
          <p className="font-display text-xs font-bold tracking-wide text-brand uppercase">Your reading path</p>
          <h2 id="path-heading" className="font-display mt-1 text-2xl font-bold sm:text-3xl">
            Read, practice, think
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["01", "Read the story", "Meet the characters and follow the adventure.", exactStoryPath],
              ["02", "Practice the words", "Build vocabulary from the story in context.", `/vocabulary?id=${encodeURIComponent(packId)}`],
              ["03", "Think it through", "Answer questions and reveal explanations.", `/quiz?id=${encodeURIComponent(packId)}`],
            ].map(([number, label, detail, href]) => (
              <Link
                key={number}
                href={href}
                className="hover-pop rounded-xl border-2 border-surface-border bg-surface p-5 shadow-sm focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none"
              >
                <span className="font-display text-sm font-bold text-brand">{number}</span>
                <h3 className="font-display mt-3 text-lg font-bold">{label}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{detail}</p>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="genre-heading">
          <h2 id="genre-heading" className="font-display text-2xl font-bold sm:text-3xl">
            Choose your next adventure
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {GENRES.map(([label, value]) => (
              <Link
                key={value}
                href={`/library?genre=${encodeURIComponent(value)}`}
                className="font-display rounded-full border-2 border-surface-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-brand/40 hover:text-brand focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col justify-between gap-5 border-y-2 border-surface-border py-7 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-xs font-bold tracking-wide text-brand uppercase">For teachers and grown-ups</p>
            <h2 className="font-display mt-1 text-2xl font-bold">Take a story into the classroom</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Every pack includes printable vocabulary, comprehension questions, and an answer key.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href={`/print/${encodeURIComponent(packId)}`} className="font-display rounded-full bg-brand px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-dark focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none">
              Print featured pack
            </Link>
            <Link href="/library" className="font-display rounded-full border-2 border-brand px-5 py-2.5 font-semibold text-brand hover:bg-brand/5 focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none">
              Browse stories
            </Link>
          </div>
        </section>
      </main>

      <footer className="mt-12 pb-4 text-center text-sm text-muted">
        Come back tomorrow for a brand-new story!
      </footer>
    </div>
  );
}
