import { z } from "zod";

export const STORY_MODELS = [
  {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    profile: "Fast draft",
    cost: "$",
  },
  {
    id: "z-ai/glm-5.2",
    label: "GLM 5.2",
    profile: "Balanced story quality",
    cost: "$$",
  },
  {
    id: "z-ai/glm-5.3",
    label: "GLM 5.3",
    profile: "Current latest GLM story model",
    cost: "$$",
  },
  {
    id: "openai/gpt-5.5",
    label: "GPT-5.5",
    profile: "Highest story quality",
    cost: "$$$",
  },
] as const;

export const LEARNING_MODELS = [
  {
    id: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    profile: "Fast structured output",
    cost: "$",
  },
  {
    id: "z-ai/glm-5.3-flash",
    label: "GLM 5.3 Flash",
    profile: "Current latest GLM Flash model",
    cost: "$",
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o mini",
    profile: "Balanced structured output",
    cost: "$$",
  },
  {
    id: "openai/gpt-4o",
    label: "GPT-4o",
    profile: "Highest learning quality",
    cost: "$$$",
  },
] as const;

export const IMAGE_MODELS = [
  {
    id: "google/gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash Image",
    profile: "Fast 16:9 illustrations",
    cost: "$$",
  },
  {
    id: "microsoft/mai-image-2.5",
    label: "Microsoft MAI Image 2.5",
    profile: "High-quality 16:9 illustrations",
    cost: "$$",
  },
] as const;

export const SPEECH_MODELS = [
  {
    id: "microsoft/mai-voice-2-flash",
    label: "MAI Voice 2 Flash",
    profile: "Fast, expressive English narration",
    cost: "$$",
    pricePerCharacterUsd: 0.000015,
    voices: [{ id: "en-US-Harper:MAI-Voice-2", label: "Harper" }],
  },
  {
    id: "microsoft/mai-voice-2",
    label: "MAI Voice 2",
    profile: "Natural long-form educational narration",
    cost: "$$",
    pricePerCharacterUsd: 0.000022,
    voices: [{ id: "en-US-Harper:MAI-Voice-2", label: "Harper" }],
  },
  {
    id: "x-ai/grok-voice-tts-1.0",
    label: "Grok Voice TTS",
    profile: "Expressive narration with multiple voices",
    cost: "$$",
    pricePerCharacterUsd: 0.000015,
    voices: [
      { id: "ara", label: "Ara" },
      { id: "eve", label: "Eve" },
      { id: "leo", label: "Leo" },
      { id: "rex", label: "Rex" },
      { id: "sal", label: "Sal" },
    ],
  },
] as const;

export const NarrationOptionsSchema = z.discriminatedUnion("model", [
  z
    .object({
      model: z.literal("microsoft/mai-voice-2-flash"),
      voice: z.literal("en-US-Harper:MAI-Voice-2"),
    })
    .strict(),
  z
    .object({
      model: z.literal("microsoft/mai-voice-2"),
      voice: z.literal("en-US-Harper:MAI-Voice-2"),
    })
    .strict(),
  z
    .object({
      model: z.literal("x-ai/grok-voice-tts-1.0"),
      voice: z.enum(["ara", "eve", "leo", "rex", "sal"]),
    })
    .strict(),
]);

export type NarrationOptions = z.infer<typeof NarrationOptionsSchema>;

const STORY_MODEL_IDS = STORY_MODELS.map((model) => model.id) as [
  (typeof STORY_MODELS)[number]["id"],
  ...(typeof STORY_MODELS)[number]["id"][],
];
const LEARNING_MODEL_IDS = LEARNING_MODELS.map((model) => model.id) as [
  (typeof LEARNING_MODELS)[number]["id"],
  ...(typeof LEARNING_MODELS)[number]["id"][],
];
const IMAGE_MODEL_IDS = IMAGE_MODELS.map((model) => model.id) as [
  (typeof IMAGE_MODELS)[number]["id"],
  ...(typeof IMAGE_MODELS)[number]["id"][],
];

export const GenerationModelsSchema = z
  .object({
    story: z.enum(STORY_MODEL_IDS),
    learning: z.enum(LEARNING_MODEL_IDS),
    image: z.enum(IMAGE_MODEL_IDS),
  })
  .strict();

export type GenerationModels = z.infer<typeof GenerationModelsSchema>;

export const GENERATION_PRESETS = {
  economy: {
    label: "Economy",
    description: "Fast, economical models for routine drafts.",
    models: {
      story: "deepseek/deepseek-v4-flash",
      learning: "deepseek/deepseek-v4-flash",
      image: "google/gemini-2.5-flash-image",
    },
  },
  balanced: {
    label: "Balanced",
    description: "Strong story quality with efficient learning and images.",
    models: {
      story: "z-ai/glm-5.2",
      learning: "deepseek/deepseek-v4-flash",
      image: "google/gemini-2.5-flash-image",
    },
  },
  quality: {
    label: "Quality",
    description: "Premium models when quality matters more than cost.",
    models: {
      story: "openai/gpt-5.5",
      learning: "openai/gpt-4o",
      image: "google/gemini-2.5-flash-image",
    },
  },
} as const satisfies Record<
  string,
  { label: string; description: string; models: GenerationModels }
>;

export type GenerationPresetId = keyof typeof GENERATION_PRESETS;

export function areGenerationModelsAllowed(
  models: unknown,
): models is GenerationModels {
  return GenerationModelsSchema.safeParse(models).success;
}
