import Link from "next/link";
import { LibraryGrid } from "@/components/library-grid";
import { listPacks } from "@/lib/store/tableStore";
import type { PackSummary } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  let initialItems: PackSummary[] = [];
  let initialCursor: string | undefined;
  try {
    const page = await listPacks({ limit: 12 });
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
        Story Library
      </h1>
      <p className="mt-1 text-muted">
        Every story we&apos;ve made — newest first.
      </p>

      <div className="mt-6">
        <LibraryGrid
          initialItems={initialItems}
          initialCursor={initialCursor}
        />
      </div>
    </div>
  );
}
