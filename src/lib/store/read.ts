import { getPackById, getLatestPack } from "./tableStore";
import { FALLBACK_PACK } from "@/lib/fallback";
import type { DailyPack } from "@/lib/schemas";

export interface ServedPack {
  pack: DailyPack;
  id: string;
  date: string;
  isSample: boolean;
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

const SAMPLE: ServedPack = {
  pack: FALLBACK_PACK,
  id: "sample",
  date: FALLBACK_PACK.date,
  isSample: true,
};

/**
 * Resolve the pack to show: a specific pack by id, else the most recently
 * generated pack, else the built-in sample. Never throws — falls back to the
 * sample if the store is unavailable (§6.3).
 */
export async function getServedPack(id?: string): Promise<ServedPack> {
  try {
    if (id) {
      const byId = await getPackById(id);
      if (byId) return { ...byId, isSample: false };
    }
    const latest = await getLatestPack();
    if (latest) return { ...latest, isSample: false };
  } catch {
    // store unavailable (e.g. Azurite not running) — fall through to the sample
  }
  return SAMPLE;
}
