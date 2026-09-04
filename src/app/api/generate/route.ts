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
import type { GenerationProgressEvent } from "@/lib/gen/progress";
import type { GenerateResult } from "@/lib/gen/pack";

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

function logGeneration(
  result: GenerateResult,
  context: { date: string; tier: string; models: unknown; ip: string },
) {
  console.log(
    JSON.stringify({
      event: "generate",
      id: result.id,
      date: context.date,
      tier: context.tier,
      durationMs: result.durationMs,
      totalTokens: result.metadata.tokens.total,
      costs: result.metadata.costs,
      models: context.models,
      images: result.metadata.images,
      audio: result.metadata.audio,
      ip: context.ip,
    }),
  );
}

function streamGeneration(input: {
  date: string;
  tier: ReturnType<typeof parseTier>;
  models: ReturnType<typeof resolveGenerationModels>;
  narration: z.infer<typeof NarrationOptionsSchema> | undefined;
  signal: AbortSignal;
  ip: string;
}) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }

      void generateAndStore({
        date: input.date,
        tier: input.tier,
        models: input.models,
        narration: input.narration,
        signal: input.signal,
        onProgress: (progress: GenerationProgressEvent) =>
          send("progress", progress),
      })
        .then((result) => {
          logGeneration(result, input);
          send("result", { ok: true, ...result });
        })
        .catch((error) => {
          send("error", {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => controller.close());
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
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
    if (req.headers.get("accept")?.includes("text/event-stream")) {
      return streamGeneration({
        date,
        tier,
        models,
        narration: body.narration,
        signal: req.signal,
        ip,
      });
    }
    const result = await generateAndStore({
      date,
      tier,
      models,
      narration: body.narration,
    });
    logGeneration(result, { date, tier, models, ip });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
}

export const GET = POST;
