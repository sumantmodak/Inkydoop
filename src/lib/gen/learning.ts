import { env } from "@/lib/env";
import { chatJson } from "@/lib/ai/openrouter";
import {
  LearningMaterialsSchema,
  type LearningMaterials,
  type Question,
  type VocabularyItem,
} from "@/lib/schemas";
import { learningSystem } from "@/lib/prompts";
import type { Tier } from "./tiers";

const MAX_DEFINITION_CHARS = 140;
const MAX_VOCABULARY_WORDS = 10;

export function filterVocabulary(
  items: VocabularyItem[],
  storyText: string,
): VocabularyItem[] {
  const text = storyText.toLowerCase();
  const seen = new Set<string>();
  const filtered: VocabularyItem[] = [];
  for (const item of items) {
    const key = item.word.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    if (item.definition.length > MAX_DEFINITION_CHARS) continue;
    if (!text.includes(item.exampleFromStory.toLowerCase())) continue;
    seen.add(key);
    filtered.push(item);
  }
  return filtered;
}

export function validateQuestions(questions: Question[]): Question[] {
  const seen = new Set<string>();
  const valid: Question[] = [];
  for (const question of questions) {
    if (seen.has(question.id)) continue;
    if (question.rubric.mustInclude.length === 0) continue;
    if (
      question.choices &&
      question.choices.length > 0 &&
      !question.choices.includes(question.answer)
    ) {
      continue;
    }
    seen.add(question.id);
    valid.push(question);
  }
  return valid;
}

export async function generateLearningMaterials(
  input: { paragraphs: string[]; candidateVocab: string[] },
  tier: Tier,
  options: { signal?: AbortSignal } = {},
): Promise<LearningMaterials> {
  const storyText = input.paragraphs.join("\n\n");
  const user = `Candidate vocabulary (hint): ${input.candidateVocab.join(", ")}\n\nStory:\n${storyText}`;
  const generated = await chatJson(
    env.OPENROUTER_MODEL_LEARNING,
    [
      {
        role: "system",
        content: learningSystem(tier, MAX_DEFINITION_CHARS),
      },
      { role: "user", content: user },
    ],
    LearningMaterialsSchema,
    { signal: options.signal },
  );

  return {
    vocabulary: filterVocabulary(generated.vocabulary, storyText).slice(
      0,
      MAX_VOCABULARY_WORDS,
    ),
    questions: validateQuestions(generated.questions),
  };
}