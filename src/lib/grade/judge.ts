import { z } from "zod";
import { env } from "@/lib/env";
import { chatJson } from "@/lib/ai/openrouter";
import {
  GradeSchema,
  type Grade,
  type GraderOutput,
  type Question,
} from "@/lib/schemas";

const JudgeSchema = z.object({ score: GradeSchema });

const SYSTEM = `You are the head teacher settling a disagreement between two graders on one elementary reading answer.
You see the rubric, the answer, and each grader's structured result (scores and rubric hits) — not their reasoning. Re-decide the final score yourself from the rubric and the answer.
Be forgiving: elementary answers are short. Score one of nailed_it | almost | lets_look_again.
Return only JSON: { "score": "nailed_it"|"almost"|"lets_look_again" }.`;

function userPrompt(
  question: Question,
  wrapped: string,
  a: GraderOutput,
  b: GraderOutput,
): string {
  const summary = (g: GraderOutput) =>
    JSON.stringify({
      score: g.score,
      mustIncludeHits: g.mustIncludeHits,
      mustIncludeMissed: g.mustIncludeMissed,
      confidence: g.confidence,
    });
  return [
    `Question: ${question.question}`,
    `Rubric mustInclude: ${JSON.stringify(question.rubric.mustInclude)}`,
    `Grader A: ${summary(a)}`,
    `Grader B: ${summary(b)}`,
    `Answer:\n${wrapped}`,
  ].join("\n\n");
}

/** Arbitrate when the two graders disagree (§6.5 Step 4). */
export async function judge(
  question: Question,
  wrapped: string,
  a: GraderOutput,
  b: GraderOutput,
  options: { signal?: AbortSignal } = {},
): Promise<Grade> {
  const { score } = await chatJson(
    env.OPENROUTER_MODEL_JUDGE,
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: userPrompt(question, wrapped, a, b) },
    ],
    JudgeSchema,
    { signal: options.signal },
  );
  return score;
}
