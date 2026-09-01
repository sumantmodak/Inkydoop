"use client";

import { useRouter } from "next/navigation";
import { TIER_IDS, type TierId } from "@/lib/schemas";
import { TIERS } from "@/lib/gen/tiers";

function saveTierCookie(tier: TierId) {
  document.cookie = `tier=${tier}; path=/; max-age=31536000; samesite=lax`;
}

/** Reader-facing reading-level picker; persists the choice in a cookie (§2). */
export function TierSelect({ current }: { current: TierId }) {
  const router = useRouter();

  function pick(tier: TierId) {
    if (tier === current) return;
    saveTierCookie(tier);
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label="Reading level"
      className="inline-flex rounded-full bg-surface p-0.5 shadow-sm"
    >
      {TIER_IDS.map((tier) => (
        <button
          key={tier}
          type="button"
          onClick={() => pick(tier)}
          aria-pressed={tier === current}
          title={`${TIERS[tier].label} · grades ${TIERS[tier].grades}`}
          className={`font-display rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none ${
            tier === current
              ? "bg-brand text-white"
              : "text-muted hover:text-brand"
          }`}
        >
          {TIERS[tier].label}
        </button>
      ))}
    </div>
  );
}
