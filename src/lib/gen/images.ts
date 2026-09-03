import { z } from "zod";
import { env } from "@/lib/env";
import { uploadImage } from "@/lib/store/blobStore";
import type { GeneratedStory, ImageSpec, StoryImage } from "@/lib/schemas";
import { IMAGE_SAFE_SUFFIX } from "@/lib/prompts";
import type { GenerationTelemetry } from "./telemetry";
import type { GenerationModels } from "@/lib/generation-models";

const OPENROUTER_IMAGE_URL = "https://openrouter.ai/api/v1/images";

const ImageResponseSchema = z.object({
  id: z.string().optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  data: z
    .array(
      z.object({
        b64_json: z.string().min(1),
        media_type: z.string().optional(),
      }),
    )
    .min(1),
  usage: z
    .object({
      cost: z.number().nonnegative().optional(),
    })
    .optional(),
});

function buildPrompt(gen: GeneratedStory, spec: ImageSpec): string {
  const characters = gen.artDirection.characters
    .map((c) => `${c.name}: ${c.look}`)
    .join("; ");
  return [
    gen.artDirection.style,
    `Setting: ${gen.artDirection.setting}.`,
    characters ? `Characters — ${characters}.` : "",
    `Scene: ${spec.prompt}`,
    IMAGE_SAFE_SUFFIX,
  ]
    .filter(Boolean)
    .join(" ");
}

function readUint24LE(buffer: Buffer, offset: number): number {
  return (
    buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16)
  );
}

function jpegDimensions(
  buffer: Buffer,
): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + length + 2 > buffer.length) return null;
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += length + 2;
  }
  return null;
}

function webpDimensions(
  buffer: Buffer,
): { width: number; height: number } | null {
  const chunk = buffer.subarray(12, 16).toString("ascii");
  if (chunk === "VP8X" && buffer.length >= 30) {
    return {
      width: readUint24LE(buffer, 24) + 1,
      height: readUint24LE(buffer, 27) + 1,
    };
  }
  if (chunk === "VP8L" && buffer.length >= 25 && buffer[20] === 0x2f) {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (
    chunk === "VP8 " &&
    buffer.length >= 30 &&
    buffer.subarray(23, 26).equals(Buffer.from([0x9d, 0x01, 0x2a]))
  ) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  return null;
}

function detectImage(buffer: Buffer): {
  ext: string;
  contentType: string;
  width?: number;
  height?: number;
} | null {
  if (buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
    const dimensions =
      buffer.length >= 24
        ? { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
        : undefined;
    return { ext: "png", contentType: "image/png", ...dimensions };
  }
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return {
      ext: "jpeg",
      contentType: "image/jpeg",
      ...jpegDimensions(buffer),
    };
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return {
      ext: "webp",
      contentType: "image/webp",
      ...webpDimensions(buffer),
    };
  }
  return null;
}

async function renderOne(
  gen: GeneratedStory,
  spec: ImageSpec,
  prefix: string,
  sceneIndex: number,
  imageModel: GenerationModels["image"],
  signal?: AbortSignal,
  telemetry?: GenerationTelemetry,
): Promise<StoryImage | null> {
  const startedAt = Date.now();
  const prompt = buildPrompt(gen, spec);
  telemetry?.prompts.push({
    step: "image",
    attempt: 1,
    model: imageModel,
    label: spec.role === "cover" ? "Cover" : `Scene ${sceneIndex}`,
    user: prompt,
  });
  try {
    const res = await fetch(OPENROUTER_IMAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.IMAGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: imageModel,
        prompt,
        aspect_ratio: "16:9",
        output_format: "webp",
        n: 1,
      }),
      signal,
    });
    if (!res.ok) {
      telemetry?.images.push({
        role: spec.role,
        status: "failed",
        model: imageModel,
        requestedAspectRatio: "16:9",
        requestedFormat: "webp",
        moderationStatus: "not_run",
        durationMs: Date.now() - startedAt,
        error: `HTTP ${res.status}`,
      });
      return null;
    }
    const parsed = ImageResponseSchema.safeParse(await res.json());
    if (!parsed.success) {
      telemetry?.images.push({
        role: spec.role,
        status: "failed",
        model: imageModel,
        requestedAspectRatio: "16:9",
        requestedFormat: "webp",
        moderationStatus: "not_run",
        durationMs: Date.now() - startedAt,
        error: "invalid_response",
      });
      return null;
    }
    const buffer = Buffer.from(parsed.data.data[0].b64_json, "base64");
    const image = detectImage(buffer);
    if (!image) {
      telemetry?.images.push({
        role: spec.role,
        status: "failed",
        model: imageModel,
        requestedAspectRatio: "16:9",
        requestedFormat: "webp",
        moderationStatus: "not_run",
        requestId: parsed.data.id,
        provider: parsed.data.provider,
        responseModel: parsed.data.model,
        bytes: buffer.length,
        durationMs: Date.now() - startedAt,
        costUsd: parsed.data.usage?.cost,
        error: "unsupported_format",
      });
      return null;
    }

    const name = spec.role === "cover" ? "cover" : `scene-${sceneIndex}`;
    const blobPath = `${prefix}/${name}.${image.ext}`;
    await uploadImage(blobPath, buffer, image.contentType);

    telemetry?.images.push({
      role: spec.role,
      status: "succeeded",
      model: imageModel,
      requestedAspectRatio: "16:9",
      requestedFormat: "webp",
      moderationStatus: "not_run",
      requestId: parsed.data.id,
      provider: parsed.data.provider,
      responseModel: parsed.data.model,
      blobPath,
      format: image.ext as "png" | "jpeg" | "webp",
      width: image.width,
      height: image.height,
      bytes: buffer.length,
      durationMs: Date.now() - startedAt,
      costUsd: parsed.data.usage?.cost,
    });

    return {
      role: spec.role,
      afterParagraph: spec.afterParagraph,
      alt: spec.alt,
      blobPath,
    };
  } catch (err) {
    telemetry?.images.push({
      role: spec.role,
      status: "failed",
      model: imageModel,
      requestedAspectRatio: "16:9",
      requestedFormat: "webp",
      moderationStatus: "not_run",
      durationMs: Date.now() - startedAt,
      error: err instanceof Error ? err.name : "render_failed",
    });
    // Non-blocking: a failed or blocked image is dropped (logged for ops).
    console.error(`[images] render failed: ${String(err)}`);
    return null;
  }
}

/** Render the story's image specs to Blob storage (§6.1 Step 4). */
export async function renderImages(
  gen: GeneratedStory,
  prefix: string,
  options: {
    models: GenerationModels;
    signal?: AbortSignal;
    telemetry?: GenerationTelemetry;
  },
): Promise<StoryImage[]> {
  let sceneCounter = 0;
  const jobs = gen.images.map((spec) => {
    const sceneIndex = spec.role === "scene" ? ++sceneCounter : 0;
    return renderOne(
      gen,
      spec,
      prefix,
      sceneIndex,
      options.models.image,
      options.signal,
      options.telemetry,
    );
  });
  const results = await Promise.all(jobs);
  return results.filter((r): r is StoryImage => r !== null);
}
