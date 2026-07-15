import type { ServedPack } from "@/lib/store/read";

export function FreshnessBanner({ meta }: { meta: ServedPack["meta"] }) {
  if (meta.isFresh) return null;
  const message = meta.isSample
    ? "Showing sample content. Generate today's pack to see something new!"
    : `Today's pack isn't ready yet — here's the latest from ${meta.servedDate}.`;
  return (
    <div
      role="status"
      className="mb-4 rounded-2xl border-2 border-sunny/40 bg-sunny/10 px-4 py-2 text-sm text-amber-800 dark:text-amber-200"
    >
      {message}
    </div>
  );
}
