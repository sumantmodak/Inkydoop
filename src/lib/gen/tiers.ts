import { type TierId, TIER_IDS } from "@/lib/schemas";

/**
 * Per-tier generation settings (§2). Drives the story's word count, reading
 * level (Flesch–Kincaid band), sentence complexity, and vocabulary difficulty.
 * `growing` matches the level the app generated before tiers existed.
 */
export interface Tier {
  id: TierId;
  label: string;
  grades: string; // human-readable grade band for prompts
  lexile: string;
  targetWords: number;
  minWords: number;
  maxWords: number;
  minGrade: number; // Flesch–Kincaid lower bound
  maxGrade: number; // Flesch–Kincaid upper bound
  vocab: string; // vocabulary guidance for the story prompt
  sentences: string; // sentence-complexity guidance for the story prompt
}

export const TIERS: Record<TierId, Tier> = {
  early: {
    id: "early",
    label: "Early",
    grades: "K–2",
    lexile: "200–500",
    targetWords: 450,
    minWords: 300,
    maxWords: 650,
    minGrade: 0.5,
    maxGrade: 2.9,
    vocab: "very simple, common Tier 1 words",
    sentences: "very short, simple sentences (mostly under 10 words)",
  },
  growing: {
    id: "growing",
    label: "Growing",
    grades: "3–6",
    lexile: "500–850",
    targetWords: 1000,
    minWords: 700,
    maxWords: 1300,
    minGrade: 2.0,
    maxGrade: 6.5,
    vocab: "Tier 1–2 words",
    sentences: "clear sentences, with some longer ones for rhythm",
  },
  middle: {
    id: "middle",
    label: "Middle",
    grades: "6–8",
    lexile: "800–1050",
    targetWords: 1200,
    minWords: 1000,
    maxWords: 1500,
    minGrade: 6.0,
    maxGrade: 9.0,
    vocab: "richer Tier 2–3 words",
    sentences: "varied, more complex sentences",
  },
};

export const DEFAULT_TIER: TierId = "growing";

/** Coerce an untrusted value to a valid tier id, defaulting to `growing`. */
export function parseTier(value: string | null | undefined): TierId {
  return TIER_IDS.includes(value as TierId) ? (value as TierId) : DEFAULT_TIER;
}
