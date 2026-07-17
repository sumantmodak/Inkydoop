import { env } from "@/lib/env";
import { chatJson } from "@/lib/ai/openrouter";
import {
  GraderOutputSchema,
  type GraderOutput,
  type Question,
} from "@/lib/schemas";
import { graderSystem } from "@/lib/prompts";

function userPrompt(
  question: Question,
  storyText: string,
  wrapped: string,
): string {
  return [
    `Question: ${question.question}`,
    `Rubric mustInclude: ${JSON.stringify(question.rubric.mustInclude)}`,
    `Rubric niceToHave: ${JSON.stringify(question.rubric.niceToHave)}`,
    `Rubric commonWrongPatterns: ${JSON.stringify(question.rubric.commonWrongPatterns)}`,
    `Story:\n${storyText}`,
    `Answer to grade:\n${wrapped}`,
  ].join("\n\n");
}

async function gradeOnce(
  framing: string,
  temperature: number,
  question: Question,
  storyText: string,
  wrapped: string,
  signal?: AbortSignal,
): Promise<GraderOutput> {
  return chatJson(
    env.OPENROUTER_MODEL_GRADER,
    [
      { role: "system", content: graderSystem(framing) },
      { role: "user", content: userPrompt(question, storyText, wrapped) },
    ],
    GraderOutputSchema,
    { temperature, signal },
  );
}

/** Two independent grader passes over the same inputs (§6.5 Step 3). */
export async function gradeTwice(
  question: Question,
  storyText: string,
  wrapped: string,
  options: { signal?: AbortSignal } = {},
): Promise<[GraderOutput, GraderOutput]> {
  return Promise.all([
    gradeOnce(
      "a strict but fair teacher",
      0,
      question,
      storyText,
      wrapped,
      options.signal,
    ),
    gradeOnce(
      "a supportive tutor",
      0.5,
      question,
      storyText,
      wrapped,
      options.signal,
    ),
  ]);
}
