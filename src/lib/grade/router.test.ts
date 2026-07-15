/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { routeAndGrade, similarity } from "@/lib/grade/router";
import type { Question } from "@/lib/schemas";

function question(overrides: Partial<Question>): Question {
  return {
    id: "q",
    type: "literal",
    question: "Where did Maya find the lantern?",
    answer: "in the attic",
    explanation: "",
    rubric: { mustInclude: ["attic"], niceToHave: [], commonWrongPatterns: [] },
    ...overrides,
  };
}

describe("routeAndGrade — multiple choice", () => {
  const mc = question({
    choices: ["In the attic", "In the garden"],
    answer: "In the attic",
  });

  it("marks the correct choice nailed_it", () => {
    expect(routeAndGrade(mc, "In the attic")).toEqual({
      handled: true,
      grade: "nailed_it",
    });
  });

  it("marks a wrong choice lets_look_again", () => {
    expect(routeAndGrade(mc, "In the garden")).toEqual({
      handled: true,
      grade: "lets_look_again",
    });
  });
});

describe("routeAndGrade — short literal", () => {
  it("accepts a close (misspelled) answer", () => {
    const r = routeAndGrade(question({}), "in the atic");
    expect(r).toEqual({ handled: true, grade: "nailed_it" });
  });

  it("accepts an answer containing the gold answer", () => {
    const r = routeAndGrade(question({}), "She found it in the attic!");
    expect(r).toEqual({ handled: true, grade: "nailed_it" });
  });

  it("rejects an unrelated answer", () => {
    const r = routeAndGrade(question({}), "at the beach");
    expect(r).toEqual({ handled: true, grade: "lets_look_again" });
  });
});

describe("routeAndGrade — escalation", () => {
  it("does not handle inferential questions", () => {
    expect(routeAndGrade(question({ type: "inferential" }), "because")).toEqual(
      {
        handled: false,
      },
    );
  });

  it("does not handle an empty literal answer", () => {
    expect(routeAndGrade(question({}), "   ")).toEqual({ handled: false });
  });
});

describe("similarity", () => {
  it("is 1 for identical strings", () => {
    expect(similarity("attic", "attic")).toBe(1);
  });

  it("is high for a small typo", () => {
    expect(similarity("attic", "atic")).toBeGreaterThan(0.75);
  });
});
