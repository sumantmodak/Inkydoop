import Link from "next/link";
import { StoryBody } from "@/components/story-body";
import { StoryImage } from "@/components/story-image";
import { FALLBACK_STORY, FALLBACK_VOCABULARY } from "@/lib/fallback";

export default function StoryPage() {
  const story = FALLBACK_STORY;
  const vocabulary = FALLBACK_VOCABULARY;
  const cover = story.images.find((img) => img.role === "cover");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <Link
        href="/"
        className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
      >
        ← Back
      </Link>

      <article className="mt-5">
        {cover && (
          <StoryImage
            alt={cover.alt}
            className="animate-pop-in mb-6 h-56 w-full rounded-3xl shadow-md"
          />
        )}

        <h1 className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl">
          {story.title}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {story.readingTimeMin} min read · tap a{" "}
          <span className="font-semibold text-brand">highlighted</span> word for
          its meaning
        </p>

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
