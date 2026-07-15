import { createHash } from "node:crypto";

const GENRES = [
  "adventure",
  "mystery",
  "science fiction",
  "friendship",
  "fable",
  "historical",
  "slice of life",
] as const;

const THEMES = [
  "courage",
  "curiosity",
  "teamwork",
  "change",
  "kindness",
  "perseverance",
  "honesty",
  "wonder",
] as const;

const SETTINGS = [
  "a foggy seaside town",
  "a busy space station",
  "a small mountain village",
  "an ancient marketplace",
  "a hidden forest",
  "a city rooftop garden",
  "a desert oasis",
  "a lakeside summer camp",
] as const;

export interface DaySeed {
  genre: string;
  theme: string;
  setting: string;
}

/**
 * Deterministically pick a genre, theme, and setting for a given date. The same
 * date always yields the same seed so a `force` regenerate is reproducible.
 */
export function seedForDate(date: string): DaySeed {
  const hash = createHash("sha256").update(date).digest();
  return {
    genre: GENRES[hash[0] % GENRES.length],
    theme: THEMES[hash[1] % THEMES.length],
    setting: SETTINGS[hash[2] % SETTINGS.length],
  };
}
