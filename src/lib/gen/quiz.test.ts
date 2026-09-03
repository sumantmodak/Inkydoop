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

  it("converts MC questions whose answer is not a choice to open response", () => {
    const bad = question({ choices: ["a", "b"], answer: "c" });
    const [validated] = validateQuestions([bad]);
    expect(validated).toMatchObject({ id: "q1", answer: "c" });
    expect(validated).not.toHaveProperty("choices");
  });

  it("canonicalizes case, spacing, and punctuation to the stored choice", () => {
    const generated = question({
      choices: ["The attic", "The cellar"],
      answer: "  the attic. ",
    });
    expect(validateQuestions([generated])[0]).toMatchObject({
      answer: "The attic",
      choices: ["The attic", "The cellar"],
    });
  });

  it("dedupes by id", () => {
    expect(validateQuestions([question({}), question({})])).toHaveLength(1);
  });
});
