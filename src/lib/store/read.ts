import { getPackById, getLatestPack } from "./tableStore";
import { FALLBACK_PACK } from "@/lib/fallback";
import type { DailyPack, TierId } from "@/lib/schemas";

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
 * generated pack for the requested tier (falling back to any tier), else the
 * built-in sample. Never throws — falls back to the sample if the store is
 * unavailable (§6.3).
 */
export async function getServedPack(
  id?: string,
  tier?: TierId,
): Promise<ServedPack> {
  try {
    if (id) {
      const byId = await getPackById(id);
      if (byId) return { ...byId, isSample: false };
    }
    const latest = await getLatestPack(tier);
    if (latest) return { ...latest, isSample: false };
    if (tier) {
      const any = await getLatestPack();
      if (any) return { ...any, isSample: false };
    }
  } catch (error) {
    console.error(`[store] serving sample pack: ${String(error)}`);
  }
  return SAMPLE;
}
