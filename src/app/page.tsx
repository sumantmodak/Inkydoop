import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mascot } from "@/components/mascot";
import { StoryImage } from "@/components/story-image";
import { TierSelect } from "@/components/tier-select";
import { ShareButton } from "@/components/share-button";
import { getServedPack, todayUtc } from "@/lib/store/read";
import { listPacks } from "@/lib/store/tableStore";
import { getTierCookie } from "@/lib/tier-cookie";
import { TIERS } from "@/lib/gen/tiers";
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
  const featuredLabel = !isSample && date === todayUtc() ? "Today's story" : "Featured story";
  const recent = recentPacks.filter((item) => item.id !== packId).slice(0, 6);
  const exactStoryPath = `/story?id=${encodeURIComponent(packId)}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
        <div className="flex items-center gap-3">
          <Mascot className="animate-bob h-14 w-14 sm:h-16 sm:w-16" />
          <h1 className="font-display text-3xl font-bold text-brand sm:text-4xl">
            Inkydoop
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <TierSelect current={tier} />
          <Link
            href="/library"
            className="font-display rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
          >
            Library
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="space-y-12 sm:space-y-16">
        <section className="animate-pop-in relative flex min-h-[32rem] flex-col justify-end overflow-hidden rounded-3xl shadow-xl ring-4 ring-white sm:min-h-[36rem] dark:ring-surface">
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
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
          />
          <Mascot className="animate-float absolute top-5 right-5 h-16 w-16 drop-shadow-lg sm:h-24 sm:w-24" />
          <div className="relative z-10 max-w-3xl p-6 sm:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display inline-block rounded-full bg-sunny px-3 py-1 text-xs font-extrabold text-[#2b2d52] shadow-md">
                {featuredLabel}
              </span>
              <span className="font-display rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand">
                {TIERS[pack.tier].label}
              </span>
              <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white capitalize backdrop-blur-sm">
                {story.genre}
              </span>
            </div>
            <h2 className="font-display mt-4 text-4xl font-bold text-white drop-shadow-md sm:text-6xl">
              {story.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              {storyHook(story.hook, story.paragraphs[0] ?? "")}
            </p>
            <p className="mt-3 text-sm font-medium text-white/75 capitalize">
              {story.theme} · {story.readingTimeMin} min read
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={exactStoryPath}
                className="font-display inline-flex min-h-11 items-center rounded-full bg-white px-6 py-2 font-bold text-brand shadow-md transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none"
              >
                Read story →
              </Link>
              <Link
                href={`/print/${encodeURIComponent(packId)}`}
                className="font-display inline-flex min-h-11 items-center rounded-full border-2 border-white/60 bg-black/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/35 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none"
              >
                Print pack
              </Link>
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
