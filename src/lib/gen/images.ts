import { z } from "zod";
import { env } from "@/lib/env";
import { uploadImage } from "@/lib/store/blobStore";
import type { GeneratedStory, ImageSpec, StoryImage } from "@/lib/schemas";
import { IMAGE_SAFE_SUFFIX } from "@/lib/prompts";

const OPENROUTER_IMAGE_URL = "https://openrouter.ai/api/v1/images";

const ImageResponseSchema = z.object({
  data: z
    .array(
      z.object({
        b64_json: z.string().min(1),
        media_type: z.string().optional(),
      }),
    )
    .min(1),
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

function detectImage(buffer: Buffer): { ext: string; contentType: string } | null {
  if (buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
    return { ext: "png", contentType: "image/png" };
  }
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return { ext: "jpeg", contentType: "image/jpeg" };
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { ext: "webp", contentType: "image/webp" };
  }
  return null;
}

async function renderOne(
  gen: GeneratedStory,
  spec: ImageSpec,
  prefix: string,
  sceneIndex: number,
  signal?: AbortSignal,
): Promise<StoryImage | null> {
  try {
    const res = await fetch(OPENROUTER_IMAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.IMAGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.IMAGE_MODEL,
        prompt: buildPrompt(gen, spec),
        aspect_ratio: "16:9",
        output_format: "webp",
        n: 1,
      }),
      signal,
    });
    if (!res.ok) return null;
    const parsed = ImageResponseSchema.safeParse(await res.json());
    if (!parsed.success) return null;
    const buffer = Buffer.from(parsed.data.data[0].b64_json, "base64");
    const image = detectImage(buffer);
    if (!image) return null;

    const name = spec.role === "cover" ? "cover" : `scene-${sceneIndex}`;
    const blobPath = `${prefix}/${name}.${image.ext}`;
    await uploadImage(blobPath, buffer, image.contentType);

    return {
      role: spec.role,
      afterParagraph: spec.afterParagraph,
      alt: spec.alt,
      blobPath,
    };
  } catch (err) {
    // Non-blocking: a failed or blocked image is dropped (logged for ops).
    console.error(`[images] render failed: ${String(err)}`);
    return null;
  }
}

/** Render the story's image specs to Blob storage (§6.1 Step 4). */
export async function renderImages(
  gen: GeneratedStory,
  prefix: string,
  options: { signal?: AbortSignal } = {},
): Promise<StoryImage[]> {
  let sceneCounter = 0;
  const jobs = gen.images.map((spec) => {
    const sceneIndex = spec.role === "scene" ? ++sceneCounter : 0;
    return renderOne(gen, spec, prefix, sceneIndex, options.signal);
  });
  const results = await Promise.all(jobs);
  return results.filter((r): r is StoryImage => r !== null);
}
