import type { Grade, Question } from "@/lib/schemas";

const FUZZY_THRESHOLD = 0.85;

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(
        dp[i] + 1,
        dp[i - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return dp[m];
}

/** 0–1 similarity between two strings after normalization. */
export function similarity(a: string, b: string): number {
  const x = normalize(a);
  const y = normalize(b);
  const maxLen = Math.max(x.length, y.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(x, y) / maxLen;
}

export type RouteResult = { handled: true; grade: Grade } | { handled: false };

/**
 * Grade multiple-choice and short-literal answers without an LLM (§6.5 Step 1).
 * Everything else (inferential/theme/vocab, or empty literal) escalates.
 */
export function routeAndGrade(question: Question, answer: string): RouteResult {
  const trimmed = answer.trim();

  if (question.choices && question.choices.length > 0) {
    const correct = normalize(answer) === normalize(question.answer);
    return { handled: true, grade: correct ? "nailed_it" : "lets_look_again" };
  }

  if (question.type === "literal" && trimmed.length > 0) {
    const student = normalize(answer);
    const gold = normalize(question.answer);
    const match =
      student === gold ||
      student.includes(gold) ||
      similarity(answer, question.answer) >= FUZZY_THRESHOLD;
    return { handled: true, grade: match ? "nailed_it" : "lets_look_again" };
  }

  return { handled: false };
}
