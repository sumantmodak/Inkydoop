import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mascot } from "@/components/mascot";
import { StoryImage } from "@/components/story-image";
import { TierSelect } from "@/components/tier-select";
import { getServedPack } from "@/lib/store/read";
import { getTierCookie } from "@/lib/tier-cookie";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tier = await getTierCookie();
  const { pack } = await getServedPack(undefined, tier);
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
      </main>

      <footer className="mt-10 text-center text-sm text-muted">
        Come back tomorrow for a brand-new story!
      </footer>
    </div>
  );
}
