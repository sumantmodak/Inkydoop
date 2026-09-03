import { env } from "@/lib/env";
import { z } from "zod";
import type { Story, StoryNarration } from "@/lib/schemas";
import { SPEECH_MODELS, type NarrationOptions } from "@/lib/generation-models";
import { uploadAudio } from "@/lib/store/blobStore";
import type { GenerationTelemetry } from "./telemetry";

const OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech";
const OPENROUTER_GENERATION_URL = "https://openrouter.ai/api/v1/generation";

const GenerationCostSchema = z.object({
  data: z.object({
    api_type: z.literal("tts"),
    total_cost: z.number().nonnegative(),
  }),
});

async function getActualCost(
  generationId: string,
  signal?: AbortSignal,
): Promise<number | undefined> {
  try {
    const response = await fetch(
      `${OPENROUTER_GENERATION_URL}?id=${encodeURIComponent(generationId)}`,
      {
        headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` },
        signal,
      },
    );
    if (!response.ok) return undefined;
    return GenerationCostSchema.parse(await response.json()).data.total_cost;
  } catch {
    return undefined;
  }
}

export function narrationText(story: Pick<Story, "title" | "paragraphs">) {
  return [story.title, ...story.paragraphs].join("\n\n");
}

export async function generateNarration(
  story: Story,
  prefix: string,
  options: {
    narration: NarrationOptions;
    signal?: AbortSignal;
    telemetry?: GenerationTelemetry;
  },
): Promise<StoryNarration | null> {
  const { narration, signal, telemetry } = options;
  const input = narrationText(story);
  const model = SPEECH_MODELS.find((item) => item.id === narration.model)!;
  const startedAt = Date.now();
  telemetry?.prompts.push({
    step: "audio",
    attempt: 1,
    model: narration.model,
    label: "Story narration",
    user: input,
  });

  try {
    const response = await fetch(OPENROUTER_SPEECH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: narration.model,
        input,
        voice: narration.voice,
        response_format: "mp3",
      }),
      signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get("content-type")?.split(";")[0];
    if (contentType !== "audio/mpeg") {
      throw new Error("unexpected_content_type");
    }

    const data = Buffer.from(await response.arrayBuffer());
    if (data.length === 0) throw new Error("empty_audio");
    const blobPath = `${prefix}/narration.mp3`;
    await uploadAudio(blobPath, data);
    const generationId = response.headers.get("x-generation-id") ?? undefined;
    const costUsd = generationId
      ? await getActualCost(generationId, signal)
      : undefined;
    const result: StoryNarration = {
      blobPath,
      model: narration.model,
      voice: narration.voice,
      format: "mp3",
      bytes: data.length,
      durationMs: Date.now() - startedAt,
      generationId,
      costUsd,
      estimatedCostUsd: input.length * model.pricePerCharacterUsd,
    };
    if (telemetry) {
      telemetry.audio = {
        status: "succeeded",
        moderationStatus: "not_run",
        ...result,
        inputCharacters: input.length,
      };
    }
    return result;
  } catch (error) {
    if (telemetry) {
      telemetry.audio = {
        status: "failed",
        moderationStatus: "not_run",
        model: narration.model,
        voice: narration.voice,
        format: "mp3",
        inputCharacters: input.length,
        bytes: 0,
        durationMs: Date.now() - startedAt,
        error:
          error instanceof Error ? error.message : "audio_generation_failed",
      };
    }
    console.error(`[audio] generation failed: ${String(error)}`);
    return null;
  }
}
