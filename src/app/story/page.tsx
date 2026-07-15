import Link from "next/link";
import { StoryBody } from "@/components/story-body";
import { StoryImage } from "@/components/story-image";
import { FALLBACK_STORY, FALLBACK_VOCABULARY } from "@/lib/fallback";

export default function StoryPage() {
  const story = FALLBACK_STORY;
  const vocabulary = FALLBACK_VOCABULARY;
  const cover = story.images.find((img) => img.role === "cover");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="text-sm text-sky-700 hover:underline focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-sky-300"
      >
        ← Back
      </Link>

      <article className="mt-4">
        {cover && (
          <StoryImage
            alt={cover.alt}
            className="mb-6 h-56 w-full rounded-2xl"
          />
        )}

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {story.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {story.readingTimeMin} min read · tap a{" "}
          <span className="font-semibold text-sky-700 dark:text-sky-300">
            highlighted
          </span>{" "}
          word for its meaning
        </p>

        <div className="mt-6">
          <StoryBody
            paragraphs={story.paragraphs}
            images={story.images}
            vocabulary={vocabulary}
          />
        </div>
      </article>
    </div>
  );
}
