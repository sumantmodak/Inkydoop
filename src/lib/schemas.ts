import { z } from "zod";

const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const WordOfTheDaySchema = z.object({
  word: z.string(),
  pos: z.string(),
  pronunciation: z.string(),
  definition: z.string(),
  examples: z.array(z.string()),
});

export const InterestingSentenceSchema = z.object({
  text: z.string(),
  tag: z.string(),
});

export const ArtDirectionSchema = z.object({
  style: z.string(),
  characters: z.array(z.object({ name: z.string(), look: z.string() })),
  setting: z.string(),
});

export const StoryImageSchema = z.object({
  role: z.enum(["cover", "scene"]),
  afterParagraph: z.number().int(),
  alt: z.string(),
  blobPath: z.string(),
});

export const StorySchema = z.object({
  title: z.string(),
  genre: z.string(),
  theme: z.string(),
  paragraphs: z.array(z.string()),
  readingTimeMin: z.number(),
  targetWords: z.array(z.string()),
  artDirection: ArtDirectionSchema,
  images: z.array(StoryImageSchema),
});

/**
 * Image spec produced by story generation (§6.1 Step 1). Becomes a StoryImage
 * once rendered and uploaded (blobPath added in §6.1 Step 4.5).
 */
export const ImageSpecSchema = z.object({
  role: z.enum(["cover", "scene"]),
  afterParagraph: z.number().int(),
  prompt: z.string(),
  alt: z.string(),
});

/**
 * Raw story-model output. Images may be missing/partial; a cheap follow-up
 * fills them without re-rolling the story text (§6.1 Step 1).
 */
export const StoryDraftSchema = z.object({
  title: z.string(),
  genre: z.string(),
  theme: z.string(),
  paragraphs: z.array(z.string()),
  candidateVocab: z.array(z.string()),
  artDirection: ArtDirectionSchema,
  images: z.array(ImageSpecSchema).optional(),
});

/** Validated story generation output (images guaranteed present). */
export const GeneratedStorySchema = StoryDraftSchema.extend({
  images: z.array(ImageSpecSchema),
});

export const VocabularyItemSchema = z.object({
  word: z.string(),
  pos: z.string(),
  definition: z.string(),
  exampleFromStory: z.string(),
  synonyms: z.array(z.string()),
  antonyms: z.array(z.string()),
});

export const QuestionTypeSchema = z.enum([
  "literal",
  "inferential",
  "vocabulary-in-context",
  "theme",
  "extra",
]);

export const RubricSchema = z.object({
  mustInclude: z.array(z.string()),
  niceToHave: z.array(z.string()),
  commonWrongPatterns: z.array(z.string()),
});

export const QuestionSchema = z.object({
  id: z.string(),
  type: QuestionTypeSchema,
  question: z.string(),
  answer: z.string(),
  explanation: z.string(),
  choices: z.array(z.string()).optional(),
  rubric: RubricSchema,
});

export const DailyPackSchema = z.object({
  date: DateSchema,
  wordOfTheDay: WordOfTheDaySchema,
  interestingSentences: z.array(InterestingSentenceSchema),
  story: StorySchema,
  vocabulary: z.array(VocabularyItemSchema),
  questions: z.array(QuestionSchema),
});

/** Story-independent front-page content (§6.1 Step 4). */
export const FrontPageSchema = z.object({
  wordOfTheDay: WordOfTheDaySchema,
  interestingSentences: z.array(InterestingSentenceSchema),
});

/** Metadata-only projection for the Story Library (§3.5). */
export const PackSummarySchema = z.object({
  date: DateSchema,
  title: z.string(),
  genre: z.string(),
  theme: z.string(),
  readingTimeMin: z.number(),
  coverBlobPath: z.string().nullable(),
});

export const GradeSchema = z.enum(["nailed_it", "almost", "lets_look_again"]);

/** One grader's structured output (§6.5 Step 3). */
export const GraderOutputSchema = z.object({
  score: GradeSchema,
  mustIncludeHits: z.array(z.string()),
  mustIncludeMissed: z.array(z.string()),
  wrongPatternHits: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

/** Final result returned by the grading pipeline / POST /api/grade. */
export const GradeResultSchema = z.object({
  grade: GradeSchema,
  feedback: z.string(),
  graderAgreement: z.boolean(),
  judged: z.boolean(),
});

/** Produced by the §6.5 grading pipeline. */
export const QuizAttemptSchema = z.object({
  questionId: z.string(),
  studentAnswer: z.string(),
  grade: GradeSchema,
  mustIncludeHits: z.array(z.string()),
  feedback: z.string(),
  graderAgreement: z.boolean(),
  judged: z.boolean(),
});

export type WordOfTheDay = z.infer<typeof WordOfTheDaySchema>;
export type InterestingSentence = z.infer<typeof InterestingSentenceSchema>;
export type ArtDirection = z.infer<typeof ArtDirectionSchema>;
export type StoryImage = z.infer<typeof StoryImageSchema>;
export type Story = z.infer<typeof StorySchema>;
export type ImageSpec = z.infer<typeof ImageSpecSchema>;
export type StoryDraft = z.infer<typeof StoryDraftSchema>;
export type GeneratedStory = z.infer<typeof GeneratedStorySchema>;
export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type Rubric = z.infer<typeof RubricSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type DailyPack = z.infer<typeof DailyPackSchema>;
export type FrontPage = z.infer<typeof FrontPageSchema>;
export type PackSummary = z.infer<typeof PackSummarySchema>;
export type Grade = z.infer<typeof GradeSchema>;
export type GraderOutput = z.infer<typeof GraderOutputSchema>;
export type GradeResult = z.infer<typeof GradeResultSchema>;
export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;
