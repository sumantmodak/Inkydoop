import { z } from "zod";
import { env } from "@/lib/env";
import { chatJson } from "@/lib/ai/openrouter";
import {
  QuestionSchema,
  type Question,
  type VocabularyItem,
} from "@/lib/schemas";
import { QUIZ_SYSTEM } from "@/lib/prompts";

const QuizResponseSchema = z.object({ questions: z.array(QuestionSchema) });

/** Drop questions with a duplicate id, empty rubric, or an MC answer not in its choices. */
export function validateQuestions(questions: Question[]): Question[] {
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const q of questions) {
    if (seen.has(q.id)) continue;
    if (q.rubric.mustInclude.length === 0) continue;
    if (q.choices && q.choices.length > 0 && !q.choices.includes(q.answer)) {
      continue;
    }
    seen.add(q.id);
    out.push(q);
  }
  return out;
}

/** Generate comprehension questions with pre-computed rubrics (§6.1 Step 3). */
export async function generateQuestions(
  input: { paragraphs: string[]; vocabulary: VocabularyItem[] },
  options: { signal?: AbortSignal } = {},
): Promise<Question[]> {
  const storyText = input.paragraphs.join("\n\n");
  const vocab = input.vocabulary.map((v) => v.word).join(", ");
  const user = `Vocabulary words: ${vocab}\n\nStory:\n${storyText}`;
  const { questions } = await chatJson(
    env.OPENROUTER_MODEL_QUIZ,
    [
      { role: "system", content: QUIZ_SYSTEM },
      { role: "user", content: user },
    ],
    QuizResponseSchema,
    { signal: options.signal },
  );
  return validateQuestions(questions);
}
