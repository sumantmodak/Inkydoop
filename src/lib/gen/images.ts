import { env } from "@/lib/env";
import { uploadImage } from "@/lib/store/blobStore";
import type { GeneratedStory, ImageSpec, StoryImage } from "@/lib/schemas";
import { IMAGE_SAFE_SUFFIX } from "@/lib/prompts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

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

function parseDataUrl(url: string): { ext: string; buffer: Buffer } | null {
  const match = /^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i.exec(url);
  if (!match) return null;
  const ext =
    match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
  return { ext, buffer: Buffer.from(match[2], "base64") };
}

async function renderOne(
  gen: GeneratedStory,
  spec: ImageSpec,
  prefix: string,
  sceneIndex: number,
  signal?: AbortSignal,
): Promise<StoryImage | null> {
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.IMAGE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.IMAGE_MODEL,
        messages: [{ role: "user", content: buildPrompt(gen, spec) }],
        modalities: ["image", "text"],
      }),
      signal,
    });
    if (!res.ok) return null;
    const body = await res.json();
    const url = body?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (typeof url !== "string") return null;
    const parsed = parseDataUrl(url);
    if (!parsed) return null;

    const name = spec.role === "cover" ? "cover" : `scene-${sceneIndex}`;
    const blobPath = `${prefix}/${name}.${parsed.ext}`;
    await uploadImage(blobPath, parsed.buffer, `image/${parsed.ext}`);

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

/** Render the story's image specs to Blob storage (§6.1 Step 4.5). */
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
