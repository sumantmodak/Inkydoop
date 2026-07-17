import { z } from "zod";
import { env } from "@/lib/env";
import { chatJson } from "@/lib/ai/openrouter";
import {
  GradeSchema,
  type Grade,
  type GraderOutput,
  type Question,
} from "@/lib/schemas";
import { JUDGE_SYSTEM } from "@/lib/prompts";

const JudgeSchema = z.object({ score: GradeSchema });

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
      { role: "system", content: JUDGE_SYSTEM },
      { role: "user", content: userPrompt(question, wrapped, a, b) },
    ],
    JudgeSchema,
    { signal: options.signal },
  );
  return score;
}
