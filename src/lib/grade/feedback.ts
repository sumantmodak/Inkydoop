import { z } from "zod";
import { env } from "@/lib/env";
import { chatJson } from "@/lib/ai/openrouter";
import type { Grade, Question } from "@/lib/schemas";
import { FEEDBACK_SYSTEM } from "@/lib/prompts";

const FeedbackSchema = z.object({ feedback: z.string() });

/** Static, always-available feedback keyed on the grade. */
export function staticFeedback(grade: Grade): string {
  switch (grade) {
    case "nailed_it":
      return "Great job! That's exactly right.";
    case "almost":
      return "So close — you've got part of it!";
    case "lets_look_again":
      return "Good try! Let's peek at the story again.";
  }
}

/** Turn a grade into kind, specific feedback (§6.5 Step 5). */
export async function generateFeedback(
  grade: Grade,
  question: Question,
  hits: string[],
  options: { signal?: AbortSignal } = {},
): Promise<string> {
  const user = [
    `Question: ${question.question}`,
    `Grade: ${grade}`,
    `Concepts the student got: ${JSON.stringify(hits)}`,
    `A correct answer: ${question.answer}`,
  ].join("\n");
  try {
    const { feedback } = await chatJson(
      env.OPENROUTER_MODEL_WOTD,
      [
        { role: "system", content: FEEDBACK_SYSTEM },
        { role: "user", content: user },
      ],
      FeedbackSchema,
      { signal: options.signal },
    );
    return feedback;
  } catch {
    return staticFeedback(grade);
  }
}
