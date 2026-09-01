import Link from "next/link";
import { LibraryGrid } from "@/components/library-grid";
import { listPacks } from "@/lib/store/tableStore";
import type { PackSummary } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const { genre: genreRaw } = await searchParams;
  const genre =
    genreRaw && /^[a-z][a-z /()-]{0,49}$/.test(genreRaw)
      ? genreRaw
      : undefined;
  let initialItems: PackSummary[] = [];
  let initialCursor: string | undefined;
  try {
    const page = await listPacks({ limit: 12, genre });
    initialItems = page.items;
    initialCursor = page.nextCursor;
  } catch {
    // Store unavailable — render the empty state.
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
      <Link
        href="/"
        className="font-display inline-flex items-center gap-1 rounded-full bg-surface px-4 py-1.5 text-sm font-semibold text-brand shadow-sm transition-transform hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
      >
        ← Back
      </Link>

      <h1 className="font-display mt-5 text-3xl font-bold text-brand sm:text-4xl">
        {genre ? `${genre} stories` : "Story Library"}
      </h1>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-muted">
        <p>
          {genre
            ? `Explore every ${genre} story, newest first.`
            : "Every story we've made — newest first."}
        </p>
        {genre && (
          <Link href="/library" className="text-sm font-semibold text-brand hover:underline">
            Clear filter
          </Link>
        )}
      </div>

      <div className="mt-6">
        <LibraryGrid
          initialItems={initialItems}
          initialCursor={initialCursor}
          genre={genre}
        />
      </div>
    </div>
  );
}
