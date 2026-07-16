import Link from "next/link";
import { StoryBody } from "@/components/story-body";
import { StoryImage } from "@/components/story-image";
import { getServedPack } from "@/lib/store/read";

export const dynamic = "force-dynamic";

export default async function StoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date : undefined;
  const { pack, meta } = await getServedPack(validDate);
  const story = pack.story;
  const vocabulary = pack.vocabulary;
  const cover = story.images.find((img) => img.role === "cover");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          ← Back
        </Link>
        <Link
          href={`/print/${meta.servedDate}`}
          className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
        >
          🖨 Teacher&apos;s Pack
        </Link>
      </div>

      {cover?.blobPath ? (
        <div className="animate-pop-in group relative mt-4 overflow-hidden rounded-3xl shadow-md">
          <StoryImage
            alt={cover.alt}
            blobPath={cover.blobPath}
            className="w-full transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <span className="font-display inline-block -rotate-2 rounded-full bg-sunny px-3 py-1 text-xs font-extrabold text-[#2b2d52] shadow-md">
              ✦ Today&apos;s Story
            </span>
            <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-white [text-shadow:0_2px_10px_rgba(0,0,0,0.6)] sm:text-4xl">
              {story.title}
            </h1>
            <p className="mt-1.5 text-sm font-medium text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.65)]">
              {story.readingTimeMin} min read · tap a{" "}
              <span className="font-semibold text-sunny">highlighted</span> word
              for its meaning
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5">
          <h1 className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl">
            {story.title}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {story.readingTimeMin} min read · tap a{" "}
            <span className="font-semibold text-brand">highlighted</span> word
            for its meaning
          </p>
        </div>
      )}

      <article className="mt-6">
        <StoryBody
          paragraphs={story.paragraphs}
          images={story.images}
          vocabulary={vocabulary}
        />

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
