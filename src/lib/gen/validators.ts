import type { GeneratedStory } from "@/lib/schemas";

export const TARGET_WORD_COUNT = 1000;
export const WORD_TOLERANCE = 0.3;
export const MIN_WORDS = Math.round(TARGET_WORD_COUNT * (1 - WORD_TOLERANCE));
export const MAX_WORDS = Math.round(TARGET_WORD_COUNT * (1 + WORD_TOLERANCE));

// Flesch–Kincaid grade band appropriate for grades 3–5.
export const MIN_GRADE = 2.0;
export const MAX_GRADE = 6.5;

const BANNED = [
  /\bkill(s|ed|ing)?\b/i,
  /\bblood(y|ied)?\b/i,
  /\bgun(s)?\b/i,
  /\bknife\b/i,
  /\bknives\b/i,
  /\bdead\b/i,
  /\bdeath\b/i,
  /\bmurder\b/i,
  /\bhorror\b/i,
  /\bkiss(es|ed|ing)?\b/i,
  /\bdamn\b/i,
  /\bhell\b/i,
];

export function countWords(paragraphs: string[]): number {
  return paragraphs.join(" ").trim().split(/\s+/).filter(Boolean).length;
}

function countSentences(text: string): number {
  const parts = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return Math.max(1, parts.length);
}

function countSyllablesInWord(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/e$/, "").match(/[aeiouy]+/g);
  return groups ? Math.max(1, groups.length) : 1;
}

/** Flesch–Kincaid grade level for a block of text. */
export function readingGrade(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount === 0) return 0;
  const sentences = countSentences(text);
  const syllables = words.reduce((sum, w) => sum + countSyllablesInWord(w), 0);
  return (
    0.39 * (wordCount / sentences) + 11.8 * (syllables / wordCount) - 15.59
  );
}

/** Returns the banned patterns found in the text (empty = clean). */
export function checkSafety(text: string): string[] {
  return BANNED.filter((re) => re.test(text)).map((re) => re.source);
}

export type StoryIssueKind =
  "word_count" | "reading_level" | "safety" | "structure";

export interface StoryIssue {
  kind: StoryIssueKind;
  message: string;
}

export function validateStory(story: GeneratedStory): StoryIssue[] {
  const issues: StoryIssue[] = [];

  const words = countWords(story.paragraphs);
  if (words < MIN_WORDS || words > MAX_WORDS) {
    issues.push({
      kind: "word_count",
      message: `word count ${words} is outside ${MIN_WORDS}-${MAX_WORDS}`,
    });
  }

  const text = `${story.title} ${story.paragraphs.join(" ")}`;
  const grade = readingGrade(story.paragraphs.join(" "));
  if (grade < MIN_GRADE || grade > MAX_GRADE) {
    issues.push({
      kind: "reading_level",
      message: `reading grade ${grade.toFixed(1)} is outside ${MIN_GRADE}-${MAX_GRADE}`,
    });
  }

  const flagged = checkSafety(text);
  if (flagged.length > 0) {
    issues.push({
      kind: "safety",
      message: `unsafe content matched: ${flagged.join(", ")}`,
    });
  }

  const covers = story.images.filter((i) => i.role === "cover");
  const scenes = story.images.filter((i) => i.role === "scene");
  if (covers.length !== 1) {
    issues.push({
      kind: "structure",
      message: `expected exactly 1 cover image, got ${covers.length}`,
    });
  }
  if (scenes.length < 1) {
    issues.push({
      kind: "structure",
      message: `expected at least 1 scene image, got ${scenes.length}`,
    });
  }

  return issues;
}
