import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { generateAndStore } from "@/lib/gen/pack";
import { rateLimit } from "@/lib/rate-limit";
import { todayUtc } from "@/lib/store/read";

export const dynamic = "force-dynamic";
// Generation can take several minutes (the story model dominates). Allow ample
// headroom so slow models aren't cut off mid-pipeline.
export const maxDuration = 800;

function authorized(req: NextRequest): boolean {
  const provided =
    req.headers.get("x-generate-key") ??
    new URL(req.url).searchParams.get("key") ??
    "";
  const expected = env.GENERATE_API_KEY;
  if (!expected || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const ip = clientIp(req);
  if (!rateLimit(`generate:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? todayUtc();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  try {
    const result = await generateAndStore({ date });
    console.log(
      JSON.stringify({
        event: "generate",
        id: result.id,
        date,
        durationMs: result.durationMs,
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
