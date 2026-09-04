import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { StoryImage } from "@/components/story-image";
import { ShareButton } from "@/components/share-button";
import { SaveStoryButton } from "@/components/save-story-button";
import { SurpriseStoryButton } from "@/components/surprise-story-button";
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
    return (await listPacks({ limit: 24, tier })).items;
  } catch {
    return [];
  }
}

function isNewStory(date: string, today: string): boolean {
  const published = new Date(`${date}T00:00:00.000Z`).getTime();
  const current = new Date(`${today}T00:00:00.000Z`).getTime();
  const ageDays = (current - published) / 86_400_000;
  return ageDays >= 0 && ageDays <= 7;
}

function storyHook(hook: string, firstParagraph: string): string {
  if (hook.trim()) return hook;
  const firstSentence = firstParagraph.match(/^.*?[.!?](?:\s|$)/)?.[0];
  return firstSentence?.trim() ?? firstParagraph;
}

function browseThemes(items: PackSummary[]): string[] {
  const themes = new Map<string, string>();
  for (const item of items) {
    const theme = item.theme.trim();
    if (theme) themes.set(theme.toLocaleLowerCase(), theme);
  }
  return [...themes.values()].slice(0, 6);
}

export default async function Home() {
  const tier = await getTierCookie();
  const [{ pack, id: packId, date, isSample }, recentPacks] = await Promise.all(
    [getServedPack(undefined, tier), loadRecent(tier)],
  );
  const story = pack.story;
  const cover = story.images.find((img) => img.role === "cover");
  const today = todayUtc();
  const featuredLabel = publicationLabel(date, isSample, today);
  const recent = recentPacks.filter((item) => item.id !== packId).slice(0, 6);
  const surpriseIds = recentPacks.map((item) => item.id);
  const themes = browseThemes(recentPacks);
  const previewWords = pack.vocabulary.slice(0, 3);
  const exactStoryPath = `/story?id=${encodeURIComponent(packId)}`;

  return (
    <div className="w-full pb-5 sm:pb-8">
      <main className="pt-4 sm:pt-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
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
                <span
                  aria-hidden="true"
                  className="h-1 w-1 rounded-full bg-white/50"
                />
                <span>{TIERS[pack.tier].label}</span>
                <span
                  aria-hidden="true"
                  className="h-1 w-1 rounded-full bg-white/50"
                />
                <span className="capitalize">{story.genre}</span>
                {story.narration && (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-1 w-1 rounded-full bg-white/50"
                    />
                    <span className="font-display inline-flex items-center gap-1 text-sunny">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                      </svg>
                      Audio included
                    </span>
                  </>
                )}
              </div>
              <h1
                id="featured-title"
                className="font-display mt-3 max-w-3xl text-3xl leading-[1.05] font-bold text-white drop-shadow-md sm:mt-4 sm:text-6xl lg:text-7xl"
              >
                {story.title}
              </h1>
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
                  <dd>
                    {pack.vocabulary.length} words · {pack.questions.length}{" "}
                    questions
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
                <Link
                  href={exactStoryPath}
                  className="font-display inline-flex min-h-12 items-center rounded-full bg-sunny px-7 py-2.5 font-bold text-[#2b2d52] shadow-md transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none"
                >
                  {story.narration ? "Read or listen" : "Read the story"}
                  &nbsp; →
                </Link>
                <span
                  aria-hidden="true"
                  className="hidden h-7 w-px bg-white/35 sm:block"
                />
                <SaveStoryButton packId={packId} />
                <ShareButton path={exactStoryPath} title={story.title} />
              </div>
            </div>
          </section>
          {previewWords.length > 0 && (
            <section
              aria-labelledby="vocabulary-preview-heading"
              className="mx-auto mt-8 flex max-w-4xl flex-col items-start justify-between gap-5 border-y-2 border-surface-border py-6 sm:flex-row sm:items-center"
            >
              <div>
                <p className="font-display text-xs font-bold tracking-wide text-brand uppercase">
                  A peek inside
                </p>
                <h2
                  id="vocabulary-preview-heading"
                  className="font-display mt-1 text-xl font-bold sm:text-2xl"
                >
                  Words you&apos;ll discover
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {previewWords.map((item) => (
                  <span
                    key={item.word}
                    className="font-display rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand"
                  >
                    {item.word}
                  </span>
                ))}
                <Link
                  href={`/vocabulary?id=${encodeURIComponent(packId)}`}
                  className="font-display px-2 py-2 text-sm font-semibold text-brand hover:underline focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
                >
                  Practice all →
                </Link>
              </div>
            </section>
          )}
        </div>

        {recent.length > 0 && (
          <section
            aria-labelledby="recent-heading"
            className="mt-14 bg-sky/10 py-10 sm:mt-20 sm:py-14 dark:bg-sky/5"
          >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="font-display text-xs font-bold tracking-wide text-brand uppercase">
                    Fresh from the library
                  </p>
                  <h2
                    id="recent-heading"
                    className="font-display mt-1 text-3xl font-bold sm:text-4xl"
                  >
                    Pick your next story
                  </h2>
                </div>
                <Link
                  href="/library"
                  className="font-display shrink-0 text-sm font-semibold text-brand hover:underline"
                >
                  See all →
                </Link>
              </div>
              <ul className="story-shelf -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-2">
                {recent.map((item) => (
                  <li
                    key={item.id}
                    className="w-44 shrink-0 snap-start sm:w-52 lg:w-auto"
                  >
                    <Link
                      href={`/story?id=${encodeURIComponent(item.id)}`}
                      className="group block focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-surface shadow-md ring-1 ring-black/10 transition-transform duration-300 group-hover:-translate-y-1">
                        <StoryImage
                          alt={`Cover for ${item.title}`}
                          blobPath={item.coverBlobPath ?? undefined}
                          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/15"
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-y-0 left-0 w-1.5 bg-white/20 shadow-[2px_0_4px_rgba(0,0,0,0.3)]"
                        />
                        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 text-[0.65rem] font-bold uppercase">
                          {isNewStory(item.date, today) ? (
                            <span className="font-display rounded-sm bg-sunny px-2 py-1 text-[#2b2d52] shadow-sm">
                              New
                            </span>
                          ) : (
                            <span />
                          )}
                          <span className="font-display rounded-sm bg-white/90 px-2 py-1 text-brand shadow-sm">
                            {TIERS[item.tier].label}
                          </span>
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                          <h3 className="font-display line-clamp-3 text-lg leading-tight font-bold drop-shadow-sm">
                            {item.title}
                          </h3>
                        </div>
                      </div>
                      <p className="mt-2 line-clamp-1 text-xs text-muted capitalize">
                        {item.genre}
                      </p>
                      <p className="font-display mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <span>{item.readingTimeMin} min read</span>
                        {item.hasNarration && (
                          <span className="inline-flex items-center gap-1 text-brand">
                            <span aria-hidden="true">·</span>
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                            </svg>
                            Audio
                          </span>
                        )}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section
          aria-labelledby="path-heading"
          className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20"
        >
          <p className="font-display text-xs font-bold tracking-wide text-brand uppercase">
            Your reading path
          </p>
          <h2
            id="path-heading"
            className="font-display mt-1 text-3xl font-bold sm:text-4xl"
          >
            Read, practice, think
          </h2>
          <div className="mt-7 grid border-y-2 border-surface-border sm:grid-cols-3">
            {[
              [
                "01",
                "Read or listen",
                "Read at your pace, with narration on select stories.",
                exactStoryPath,
              ],
              [
                "02",
                "Practice the words",
                "Build vocabulary from the story in context.",
                `/vocabulary?id=${encodeURIComponent(packId)}`,
              ],
              [
                "03",
                "Think it through",
                "Answer questions and reveal explanations.",
                `/quiz?id=${encodeURIComponent(packId)}`,
              ],
            ].map(([number, label, detail, href]) => (
              <Link
                key={number}
                href={href}
                className="group border-b-2 border-surface-border py-6 last:border-b-0 focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none sm:border-r-2 sm:border-b-0 sm:px-6 sm:first:pl-0 sm:last:border-r-0 sm:last:pr-0"
              >
                <span className="font-display text-sm font-bold text-brand">
                  {number}
                </span>
                <h3 className="font-display mt-3 text-xl font-bold transition-colors group-hover:text-brand">
                  {label}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {detail}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-sunny/15 py-12 sm:py-16 dark:bg-sunny/5">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.42fr] lg:gap-14">
            <div aria-labelledby="genre-heading">
              <p className="font-display text-xs font-bold tracking-wide text-coral uppercase">
                Browse by feeling
              </p>
              <h2
                id="genre-heading"
                className="font-display mt-1 text-3xl font-bold sm:text-4xl"
              >
                Choose your next adventure
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {GENRES.map(([label, value]) => (
                  <Link
                    key={value}
                    href={`/library?genre=${encodeURIComponent(value)}`}
                    className="font-display rounded-full border-2 border-surface-border bg-surface px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-coral/50 hover:text-coral focus-visible:ring-4 focus-visible:ring-coral/20 focus-visible:outline-none"
                  >
                    {label}
                  </Link>
                ))}
              </div>
              {themes.length >= 3 && (
                <div className="mt-8 border-t-2 border-coral/15 pt-6">
                  <h3 className="font-display text-lg font-bold">
                    Or follow a theme
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
                    {themes.map((theme) => (
                      <Link
                        key={theme}
                        href={`/library?theme=${encodeURIComponent(theme)}`}
                        className="font-display text-sm font-semibold text-brand capitalize underline decoration-brand/25 decoration-2 underline-offset-4 hover:decoration-brand focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:outline-none"
                      >
                        {theme}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {surpriseIds.length > 0 && (
              <div className="border-t-2 border-coral/20 pt-8 lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-10">
                <p className="font-display text-xs font-bold tracking-wide text-coral uppercase">
                  Feeling curious?
                </p>
                <h3 className="font-display mt-1 text-2xl font-bold">
                  Let Inky choose.
                </h3>
                <p className="mt-2 mb-5 text-sm leading-relaxed text-muted">
                  Jump into a random approved story at your reading level.
                </p>
                <SurpriseStoryButton
                  currentId={packId}
                  storyIds={surpriseIds}
                />
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-5 px-4 py-12 sm:flex-row sm:items-center sm:px-6 sm:py-16">
          <div>
            <p className="font-display text-xs font-bold tracking-wide text-brand uppercase">
              For teachers and grown-ups
            </p>
            <h2 className="font-display mt-1 text-2xl font-bold">
              Take a story into the classroom
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Every pack includes printable vocabulary, comprehension questions,
              and an answer key.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/print/${encodeURIComponent(packId)}`}
              className="font-display rounded-full bg-brand px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-brand-dark focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none"
            >
              Print featured pack
            </Link>
            <Link
              href="/library"
              className="font-display rounded-full border-2 border-brand px-5 py-2.5 font-semibold text-brand hover:bg-brand/5 focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none"
            >
              Browse stories
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="trust-heading"
          className="bg-[#242642] py-10 text-white sm:py-12"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <p className="font-display text-xs font-bold tracking-wide text-sunny uppercase">
              For grown-ups
            </p>
            <h2
              id="trust-heading"
              className="font-display mt-1 text-2xl font-bold sm:text-3xl"
            >
              Made for thoughtful reading
            </h2>
            <dl className="mt-7 grid gap-6 sm:grid-cols-3">
              {[
                [
                  "Human-reviewed",
                  "New stories stay private until an adult approves them.",
                ],
                [
                  "No reader account",
                  "Children can read and practice without signing in.",
                ],
                [
                  "Classroom ready",
                  "Every story includes a printable learning pack.",
                ],
              ].map(([label, detail], index) => (
                <div key={label} className="border-l-2 border-sunny/60 pl-4">
                  <dt className="font-display flex items-center gap-2 font-bold">
                    <span className="text-sunny">0{index + 1}</span>
                    {label}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-white/70">
                    {detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-surface-border px-4 pt-8 pb-4 text-center text-sm text-muted">
        Come back tomorrow for a brand-new story!
      </footer>
    </div>
  );
}
