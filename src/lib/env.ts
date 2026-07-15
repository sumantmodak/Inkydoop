import { z } from "zod";

if (typeof window !== "undefined") {
  throw new Error(
    "env.ts is server-only and must not be imported in client code",
  );
}

const EnvSchema = z
  .object({
    // OpenRouter (text) — default to OpenAI models routed through OpenRouter
    OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
    OPENROUTER_MODEL_STORY: z.string().default("openai/gpt-5.5"),
    OPENROUTER_MODEL_VOCAB: z.string().default("openai/gpt-4o-mini"),
    OPENROUTER_MODEL_QUIZ: z.string().default("openai/gpt-4o-mini"),
    OPENROUTER_MODEL_WOTD: z.string().default("openai/gpt-4o-mini"),
    OPENROUTER_MODEL_GRADER: z.string().default("openai/gpt-4o-mini"),
    OPENROUTER_MODEL_JUDGE: z.string().default("openai/gpt-4o"),

    // Image generation (via OpenRouter chat completions with image modality)
    IMAGE_API_KEY: z.string().min(1, "IMAGE_API_KEY is required"),
    IMAGE_MODEL: z.string().default("google/gemini-2.5-flash-image"),

    // Azure Storage — dev uses the connection string, prod uses Managed Identity + account name
    AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
    AZURE_STORAGE_ACCOUNT: z.string().optional(),
    AZURE_TABLE_NAME: z.string().default("DailyPacks"),
    AZURE_BLOB_CONTAINER: z.string().default("story-images"),

    // Generation endpoint auth
    GENERATE_API_KEY: z
      .string()
      .min(32, "GENERATE_API_KEY must be at least 32 characters"),
  })
  .refine(
    (e) =>
      Boolean(e.AZURE_STORAGE_CONNECTION_STRING || e.AZURE_STORAGE_ACCOUNT),
    {
      message:
        "Set AZURE_STORAGE_CONNECTION_STRING (dev) or AZURE_STORAGE_ACCOUNT (prod)",
    },
  );

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export function getEnv(): Env {
  if (!cached) cached = loadEnv();
  return cached;
}

// Lazy: validation runs on first property access (request time), not at import,
// so `next build` doesn't require runtime secrets.
export const env: Env = new Proxy({} as Env, {
  get: (_target, prop) => getEnv()[prop as keyof Env],
});
