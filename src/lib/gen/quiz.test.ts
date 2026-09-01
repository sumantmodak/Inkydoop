/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { validateQuestions } from "@/lib/gen/learning";
import type { Question } from "@/lib/schemas";

function question(overrides: Partial<Question>): Question {
  return {
    id: "q1",
    type: "literal",
    question: "Where?",
    answer: "attic",
    explanation: "It says so.",
    rubric: { mustInclude: ["attic"], niceToHave: [], commonWrongPatterns: [] },
    ...overrides,
  };
}

describe("validateQuestions", () => {
  it("keeps a well-formed question", () => {
    expect(validateQuestions([question({})])).toHaveLength(1);
  });

  it("drops questions with an empty rubric", () => {
    const bad = question({
      rubric: { mustInclude: [], niceToHave: [], commonWrongPatterns: [] },
    });
    expect(validateQuestions([bad])).toHaveLength(0);
  });

  it("drops MC questions whose answer is not a choice", () => {
    const bad = question({ choices: ["a", "b"], answer: "c" });
    expect(validateQuestions([bad])).toHaveLength(0);
  });

  it("dedupes by id", () => {
    expect(validateQuestions([question({}), question({})])).toHaveLength(1);
  });
});
