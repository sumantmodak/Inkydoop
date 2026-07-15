import Link from "next/link";
import { StoryBody } from "@/components/story-body";
import { StoryImage } from "@/components/story-image";
import { FreshnessBanner } from "@/components/freshness-banner";
import { getServedPack } from "@/lib/store/read";

export const dynamic = "force-dynamic";

export default async function StoryPage() {
  const { pack, meta } = await getServedPack();
  const story = pack.story;
  const vocabulary = pack.vocabulary;
  const cover = story.images.find((img) => img.role === "cover");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <FreshnessBanner meta={meta} />
      <Link
        href="/"
        className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
      >
        ← Back
      </Link>

      <article className="mt-5">
        {cover ? (
          <header className="animate-pop-in relative mb-8 overflow-hidden rounded-[2rem] shadow-xl ring-4 ring-white dark:ring-surface">
            <StoryImage
              alt={cover.alt}
              blobPath={cover.blobPath}
              className="aspect-[4/3] w-full sm:aspect-[16/10]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <span className="font-display absolute top-4 left-4 -rotate-3 rounded-full bg-sunny px-3 py-1 text-xs font-extrabold text-[#2b2d52] shadow-md">
              ✦ Today&apos;s Story
            </span>
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <h1 className="font-display text-3xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl">
                {story.title}
              </h1>
              <p className="mt-2 text-sm font-medium text-white/90">
                {story.readingTimeMin} min read · tap a{" "}
                <span className="font-semibold text-sunny">highlighted</span>{" "}
                word for its meaning
              </p>
            </div>
          </header>
        ) : (
          <header className="mb-6">
            <h1 className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl">
              {story.title}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {story.readingTimeMin} min read · tap a{" "}
              <span className="font-semibold text-brand">highlighted</span> word
              for its meaning
            </p>
          </header>
        )}

        <div className="mt-6">
          <StoryBody
            paragraphs={story.paragraphs}
            images={story.images}
            vocabulary={vocabulary}
          />
        </div>

        <Link
          href="/vocabulary"
          className="hover-pop mt-8 flex items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-mint to-sky p-5 text-white shadow-md focus-visible:ring-4 focus-visible:ring-mint/40 focus-visible:outline-none"
        >
          <span>
            <span className="font-display block text-lg font-bold">
              Practice the words
            </span>
            <span className="text-white/85">Try a quick vocabulary quiz.</span>
          </span>
          <span className="font-display shrink-0 rounded-full bg-white px-5 py-2 font-semibold text-emerald-700">
            Let&apos;s go →
          </span>
        </Link>
      </article>
    </div>
  );
}
