import { z } from "zod";

const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

/** Reading tiers (§2). Single source of truth for the tier ids. */
export const TIER_IDS = ["early", "growing", "middle"] as const;
export const TierIdSchema = z.enum(TIER_IDS);
export type TierId = z.infer<typeof TierIdSchema>;

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
  hook: z.string().default(""),
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
 * once rendered and uploaded (blobPath added in §6.1 Step 4).
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
  hook: z.string(),
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

export const LearningMaterialsSchema = z.object({
  vocabulary: z.array(VocabularyItemSchema).min(5).max(10),
  questions: z.array(QuestionSchema).min(5).max(8),
});

export const ProviderCallSchema = z.object({
  step: z.string(),
  attempt: z.number().int().positive(),
  model: z.string(),
  responseModel: z.string().optional(),
  provider: z.string().optional(),
  requestId: z.string().optional(),
  startedAt: z.string(),
  durationMs: z.number().int().nonnegative(),
  status: z.enum(["succeeded", "invalid_response", "failed"]),
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative().optional(),
  error: z.string().optional(),
});

export const GenerationStepSchema = z.object({
  step: z.string(),
  durationMs: z.number().int().nonnegative(),
});

export const StoryValidationAttemptSchema = z.object({
  attempt: z.number().int().positive(),
  wordCount: z.number().int().nonnegative(),
  readingGrade: z.number(),
  issues: z.array(z.string()),
});

export const GeneratedImageMetaSchema = z.object({
  role: z.enum(["cover", "scene"]),
  status: z.enum(["succeeded", "failed"]),
  model: z.string(),
  requestedAspectRatio: z.literal("16:9"),
  requestedFormat: z.literal("webp"),
  moderationStatus: z.literal("not_run"),
  requestId: z.string().optional(),
  provider: z.string().optional(),
  responseModel: z.string().optional(),
  blobPath: z.string().optional(),
  format: z.enum(["png", "jpeg", "webp"]).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  bytes: z.number().int().nonnegative().optional(),
  durationMs: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative().optional(),
  error: z.string().optional(),
});

const GenerationSelectionSchema = z.object({
  genre: z.string(),
  theme: z.string(),
  tier: TierIdSchema,
});

const GenerationMetaInputSchema = z.object({
  schemaVersion: z.literal(1),
  status: z.literal("succeeded"),
  startedAt: z.string(),
  finishedAt: z.string(),
  durationMs: z.number().int().nonnegative(),
  appVersion: z.string(),
  promptVersion: z.string(),
  selection: GenerationSelectionSchema.optional(),
  seed: GenerationSelectionSchema.optional(),
  models: z.object({
    story: z.string(),
    learning: z.string(),
    image: z.string(),
  }),
  calls: z.array(ProviderCallSchema),
  tokens: z.object({
    prompt: z.number().int().nonnegative(),
    completion: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  costUsd: z.number().nonnegative().optional(),
  costs: z
    .object({
      textUsd: z.number().nonnegative().optional(),
      imagesUsd: z.number().nonnegative().optional(),
      totalUsd: z.number().nonnegative().optional(),
    })
    .optional(),
  durationsMsByStep: z.array(GenerationStepSchema),
  retries: z.object({
    story: z.number().int().nonnegative(),
    learning: z.number().int().nonnegative(),
    invalidJson: z.number().int().nonnegative(),
  }),
  validation: z.object({
    wordCount: z.number().int().nonnegative(),
    readingGrade: z.number(),
    storyAttempts: z.array(StoryValidationAttemptSchema),
    validVocabularyItems: z.number().int().nonnegative(),
    validQuestions: z.number().int().nonnegative(),
  }),
  images: z.object({
    requested: z.number().int().nonnegative(),
    succeeded: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    totalBytes: z.number().int().nonnegative(),
    items: z.array(GeneratedImageMetaSchema),
  }),
});

export const GenerationMetaSchema = GenerationMetaInputSchema.refine(
  (metadata) => Boolean(metadata.selection || metadata.seed),
  { message: "generation selection is required" },
).transform(({ seed, selection, ...metadata }) => ({
  ...metadata,
  selection: selection ?? seed!,
}));

export const DailyPackSchema = z.object({
  date: DateSchema,
  tier: TierIdSchema.default("growing"),
  story: StorySchema,
  vocabulary: z.array(VocabularyItemSchema),
  questions: z.array(QuestionSchema),
  generation: GenerationMetaSchema.optional(),
});

/** Metadata-only projection for the Story Library (§3.5). */
export const PackSummarySchema = z.object({
  id: z.string(),
  date: DateSchema,
  tier: TierIdSchema,
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
export type LearningMaterials = z.infer<typeof LearningMaterialsSchema>;
export type ProviderCall = z.infer<typeof ProviderCallSchema>;
export type GenerationStep = z.infer<typeof GenerationStepSchema>;
export type StoryValidationAttempt = z.infer<
  typeof StoryValidationAttemptSchema
>;
export type GeneratedImageMeta = z.infer<typeof GeneratedImageMetaSchema>;
export type GenerationMeta = z.infer<typeof GenerationMetaSchema>;
export type DailyPack = z.infer<typeof DailyPackSchema>;
export type PackSummary = z.infer<typeof PackSummarySchema>;
export type Grade = z.infer<typeof GradeSchema>;
export type GraderOutput = z.infer<typeof GraderOutputSchema>;
export type GradeResult = z.infer<typeof GradeResultSchema>;
export type QuizAttempt = z.infer<typeof QuizAttemptSchema>;
