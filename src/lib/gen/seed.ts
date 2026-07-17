import { createHash } from "node:crypto";

const GENRES = [
  "adventure",
  "mystery",
  "detective story",
  "science fiction",
  "fantasy",
  "fairy tale",
  "folktale or myth",
  "friendship story",
  "slice of life",
  "school story",
  "humor / comedy",
  "animal story",
  "sports story",
  "historical fiction",
  "quest",
  "survival (gentle)",
  "time travel",
  "magical realism",
  "superhero (kid-friendly)",
  "holiday or festival story",
] as const;

const THEMES = [
  "courage",
  "curiosity",
  "teamwork",
  "kindness",
  "perseverance",
  "honesty",
  "wonder",
  "belonging",
  "responsibility",
  "creativity",
  "patience",
  "empathy",
  "gratitude",
  "believing in yourself",
  "forgiveness",
  "generosity",
  "resilience",
  "imagination",
  "fairness",
  "trying new things",
  "helping others",
  "embracing change",
  "standing up for what's right",
  "finding your place",
] as const;

export interface DaySeed {
  genre: string;
  theme: string;
}

/**
 * Deterministically pick a genre and theme for a given date. The same date
 * always yields the same seed so a `force` regenerate is reproducible. The
 * setting is intentionally left open — the model invents a fresh one (§6.1
 * Step 0) so stories aren't confined to a fixed list of places.
 */
export function seedForDate(date: string): DaySeed {
  const hash = createHash("sha256").update(date).digest();
  return {
    genre: GENRES[hash[0] % GENRES.length],
    theme: THEMES[hash[1] % THEMES.length],
  };
}
