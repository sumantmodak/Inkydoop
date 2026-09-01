import { z } from "zod";
import { env } from "@/lib/env";
import { chatJson } from "@/lib/ai/openrouter";
import { GUARD_SYSTEM } from "@/lib/prompts";

const GuardSchema = z.object({
  injection: z.boolean(),
  unsafe: z.boolean(),
});

export interface GuardResult {
  injection: boolean;
  unsafe: boolean;
}

/** Screen a student answer for prompt-injection and unsafe content (§6.5 Step 2). */
export async function guardAnswer(
  answer: string,
  options: { signal?: AbortSignal } = {},
): Promise<GuardResult> {
  try {
    return await chatJson(
      env.OPENROUTER_MODEL_GUARD,
      [
        { role: "system", content: GUARD_SYSTEM },
        { role: "user", content: answer },
      ],
      GuardSchema,
      { signal: options.signal },
    );
  } catch {
    // A guard failure should not block grading; treat as clean.
    return { injection: false, unsafe: false };
  }
}

/** Wrap untrusted student text so downstream prompts treat it as data. */
export function wrapStudentAnswer(answer: string): string {
  const sanitized = answer.replace(/[\u0000-\u001f]/g, " ").trim();
  return `<student_answer>\n${sanitized}\n</student_answer>`;
}
