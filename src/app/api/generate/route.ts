import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { generateAndStore } from "@/lib/gen/pack";
import { parseTier } from "@/lib/gen/tiers";
import { rateLimit } from "@/lib/rate-limit";
import { todayUtc } from "@/lib/store/read";
import { z } from "zod";
import {
  GenerationModelsSchema,
  NarrationOptionsSchema,
} from "@/lib/generation-models";
import { resolveGenerationModels } from "@/lib/gen/model-selection";

export const dynamic = "force-dynamic";
// Generation can take several minutes (the story model dominates). Allow ample
// headroom so slow models aren't cut off mid-pipeline.
export const maxDuration = 800;

const BodySchema = z
  .object({
    models: GenerationModelsSchema.optional(),
    narration: NarrationOptionsSchema.optional(),
  })
  .strict();

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const ip = clientIp(req);
  if (!rateLimit(`generate:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? todayUtc();
  const tier = parseTier(url.searchParams.get("tier"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  let body: z.infer<typeof BodySchema> = {};
  try {
    const text = await req.text();
    body = text ? BodySchema.parse(JSON.parse(text)) : {};
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    const models = resolveGenerationModels(body.models);
    const result = await generateAndStore({
      date,
      tier,
      models,
      narration: body.narration,
    });
    console.log(
      JSON.stringify({
        event: "generate",
        id: result.id,
        date,
        tier,
        durationMs: result.durationMs,
        totalTokens: result.metadata.tokens.total,
        costs: result.metadata.costs,
        models,
        images: result.metadata.images,
        audio: result.metadata.audio,
        ip,
      }),
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}

export const GET = POST;
