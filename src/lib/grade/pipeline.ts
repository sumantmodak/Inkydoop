import type { Grade, GradeResult, Question } from "@/lib/schemas";
import { routeAndGrade } from "./router";
import { guardAnswer, wrapStudentAnswer } from "./guard";
import { gradeTwice } from "./graders";
import { judge } from "./judge";
import { generateFeedback, staticFeedback } from "./feedback";

const GRADE_RANK: Record<Grade, number> = {
  lets_look_again: 0,
  almost: 1,
  nailed_it: 2,
};

function moreForgiving(a: Grade, b: Grade): Grade {
  return GRADE_RANK[a] >= GRADE_RANK[b] ? a : b;
}

const CONFIDENCE_FLOOR = 0.6;

/** Grade one student answer through the multi-agent pipeline (§6.5). */
export async function gradeAnswer(
  question: Question,
  answer: string,
  storyText: string,
  options: { signal?: AbortSignal } = {},
): Promise<GradeResult> {
  const { signal } = options;

  // Step 1 — Router (no LLM for MC / short literal)
  const routed = routeAndGrade(question, answer);
  if (routed.handled) {
    return {
      grade: routed.grade,
      feedback: staticFeedback(routed.grade),
      graderAgreement: true,
      judged: false,
    };
  }

  // Step 2 — Guard
  const guard = await guardAnswer(answer, { signal });
  if (guard.injection) {
    return {
      grade: "lets_look_again",
      feedback: "Let's try answering the question about the story.",
      graderAgreement: false,
      judged: false,
    };
  }
  const wrapped = wrapStudentAnswer(answer);

  // Step 3 — Graders x2
  const [a, b] = await gradeTwice(question, storyText, wrapped, { signal });

  // Step 4 — Judge (only on disagreement or low confidence)
  const graderAgreement = a.score === b.score;
  const confident =
    a.confidence >= CONFIDENCE_FLOOR && b.confidence >= CONFIDENCE_FLOOR;
  let grade: Grade;
  let judged = false;
  if (graderAgreement && confident) {
    grade = a.score;
  } else {
    try {
      grade = await judge(question, wrapped, a, b, { signal });
      judged = true;
    } catch {
      grade = moreForgiving(a.score, b.score);
    }
  }

  // Step 5 — Feedback
  const feedback = await generateFeedback(grade, question, a.mustIncludeHits, {
    signal,
  });

  return { grade, feedback, graderAgreement, judged };
}
