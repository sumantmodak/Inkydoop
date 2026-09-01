"use client";

import { useState } from "react";
import Link from "next/link";
import { StoryImage } from "@/components/story-image";
import { TIERS } from "@/lib/gen/tiers";
import type { PackSummary } from "@/lib/schemas";

interface LibraryGridProps {
  initialItems: PackSummary[];
  initialCursor?: string;
  genre?: string;
}

// Varying aspect ratios give the masonry a playful, jagged photo-wall rhythm.
const ASPECTS = [
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[5/6]",
  "aspect-[4/3]",
];

export function LibraryGrid({
  initialItems,
  initialCursor,
  genre,
}: LibraryGridProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor });
      if (genre) params.set("genre", genre);
      const res = await fetch(`/api/stories?${params}`);
      if (res.ok) {
        const data = (await res.json()) as {
          items: PackSummary[];
          nextCursor?: string;
        };
        setItems((prev) => [...prev, ...data.items]);
        setCursor(data.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <p className="rounded-3xl border-2 border-surface-border bg-surface p-6 text-center text-muted">
        {genre
          ? `No ${genre} stories yet.`
          : "No stories yet — generate today's pack to get started!"}
      </p>
    );
  }

  return (
    <>
      <ul className="gap-4 sm:columns-2 lg:columns-3">
        {items.map((s, i) => (
          <li key={s.id} className="mb-4 break-inside-avoid">
            <Link
              href={`/story?id=${s.id}`}
              className="hover-pop group block overflow-hidden rounded-3xl border-2 border-surface-border bg-surface shadow-sm focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:outline-none"
            >
              <div
                className={`w-full overflow-hidden ${ASPECTS[i % ASPECTS.length]}`}
              >
                <StoryImage
                  alt={`Cover for ${s.title}`}
                  blobPath={s.coverBlobPath ?? undefined}
                  className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-display rounded-full bg-grape/15 px-2 py-0.5 font-semibold text-grape">
                    {TIERS[s.tier].label}
                  </span>
                  <span className="font-display rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-brand capitalize">
                    {s.genre}
                  </span>
                  <span className="text-muted">
                    {s.readingTimeMin} min read
                  </span>
                </div>
                <h2 className="font-display mt-2 text-lg font-bold text-foreground">
                  {s.title}
                </h2>
                <p className="mt-0.5 text-sm text-muted capitalize">
                  {s.theme}
                </p>
                <p className="mt-2 text-xs text-muted">{s.date}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {cursor && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="font-display rounded-full bg-brand px-6 py-2.5 font-semibold text-white shadow-sm transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-brand/40 focus-visible:outline-none disabled:opacity-60"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
