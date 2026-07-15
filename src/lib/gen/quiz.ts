import { z } from "zod";
import { env } from "@/lib/env";
import { chatJson } from "@/lib/ai/openrouter";
import {
  QuestionSchema,
  type Question,
  type VocabularyItem,
} from "@/lib/schemas";

const QuizResponseSchema = z.object({ questions: z.array(QuestionSchema) });

const SYSTEM = `You write reading-comprehension questions for elementary students in grades 3-5, based on a story.
Produce 5-8 questions with this mix: 2 literal, 2 inferential, 1 vocabulary-in-context, 1 theme, and 0-2 extras.
Give each question a unique id, a type (literal | inferential | vocabulary-in-context | theme | extra), the question text, the answer, a short explanation grounded in the story, optional multiple-choice choices, and a rubric.
Write the rubric BEFORE imagining any student answer: mustInclude (1-3 concepts required for full credit), niceToHave (0-2 extras), commonWrongPatterns (0-3 misconceptions).
Return only JSON: { "questions": [{ "id": string, "type": string, "question": string, "answer": string, "explanation": string, "choices"?: string[], "rubric": { "mustInclude": string[], "niceToHave": string[], "commonWrongPatterns": string[] } }] }.`;

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
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    QuizResponseSchema,
    { signal: options.signal },
  );
  return validateQuestions(questions);
}
