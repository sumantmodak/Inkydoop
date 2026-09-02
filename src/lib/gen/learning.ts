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
import type { GenerationTelemetry } from "./telemetry";

const MAX_DEFINITION_CHARS = 140;
const MIN_VOCABULARY_WORDS = 5;
const MAX_VOCABULARY_WORDS = 10;
const MIN_QUESTIONS = 5;
const MAX_ATTEMPTS = 3;

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
  options: { signal?: AbortSignal; telemetry?: GenerationTelemetry } = {},
): Promise<LearningMaterials> {
  const storyText = input.paragraphs.join("\n\n");
  const basePrompt = `Candidate vocabulary (hint): ${input.candidateVocab.join(", ")}\n\nStory:\n${storyText}`;
  let lastCounts = { vocabulary: 0, questions: 0 };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (options.telemetry) options.telemetry.learningAttempts = attempt;
    const correction =
      attempt === 1
        ? ""
        : `\n\nCorrection: the previous response produced only ${lastCounts.vocabulary} valid vocabulary items and ${lastCounts.questions} valid questions after validation. Return 5-10 vocabulary items with verbatim story examples and 5-8 questions with unique IDs, non-empty rubrics, and every multiple-choice answer exactly matching one choice.`;
    const generated = await chatJson(
      env.OPENROUTER_MODEL_LEARNING,
      [
        {
          role: "system",
          content: learningSystem(tier, MAX_DEFINITION_CHARS),
        },
        { role: "user", content: `${basePrompt}${correction}` },
      ],
      LearningMaterialsSchema,
      {
        signal: options.signal,
        step: "learning",
        onCall: options.telemetry
          ? (call) => options.telemetry?.calls.push(call)
          : undefined,
      },
    );

    const vocabulary = filterVocabulary(generated.vocabulary, storyText).slice(
      0,
      MAX_VOCABULARY_WORDS,
    );
    const questions = validateQuestions(generated.questions);
    lastCounts = { vocabulary: vocabulary.length, questions: questions.length };
    if (options.telemetry) {
      options.telemetry.validVocabularyItems = vocabulary.length;
      options.telemetry.validQuestions = questions.length;
    }

    if (
      vocabulary.length >= MIN_VOCABULARY_WORDS &&
      questions.length >= MIN_QUESTIONS
    ) {
      return { vocabulary, questions };
    }
  }

  throw new Error(
    `Learning-material generation failed after ${MAX_ATTEMPTS} attempts: ${lastCounts.vocabulary} valid vocabulary items and ${lastCounts.questions} valid questions`,
  );
}
