import { getPack, getLatestPack } from "./tableStore";
import { FALLBACK_PACK } from "@/lib/fallback";
import type { DailyPack } from "@/lib/schemas";

export interface ServedPack {
  pack: DailyPack;
  meta: {
    requestedDate: string;
    servedDate: string;
    isFresh: boolean;
    isSample: boolean;
  };
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Resolve the pack to show for a date: exact match, else the most recent pack,
 * else the built-in sample. Never throws — falls back to the sample if the
 * store is unavailable (§6.3).
 */
export async function getServedPack(date?: string): Promise<ServedPack> {
  const requestedDate = date ?? todayUtc();
  try {
    const exact = await getPack(requestedDate);
    if (exact) {
      return {
        pack: exact,
        meta: {
          requestedDate,
          servedDate: requestedDate,
          isFresh: true,
          isSample: false,
        },
      };
    }
    const latest = await getLatestPack(requestedDate);
    if (latest) {
      return {
        pack: latest.pack,
        meta: {
          requestedDate,
          servedDate: latest.date,
          isFresh: false,
          isSample: false,
        },
      };
    }
  } catch {
    // store unavailable (e.g. Azurite not running) — fall through to the sample
  }
  return {
    pack: FALLBACK_PACK,
    meta: {
      requestedDate,
      servedDate: FALLBACK_PACK.date,
      isFresh: false,
      isSample: true,
    },
  };
}
