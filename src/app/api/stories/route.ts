import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listPacks } from "@/lib/store/tableStore";
import { PackSummarySchema, TIER_IDS, type TierId } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ResponseSchema = z.object({
  items: z.array(PackSummarySchema),
  nextCursor: z.string().optional(),
});

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

// Metadata-only, paged, newest-first listing for the Story Library (§3.5).
export async function GET(req: NextRequest) {
  if (!rateLimit(`stories:${clientIp(req)}`, 60, 60_000)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : undefined;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const tierRaw = req.nextUrl.searchParams.get("tier");
  const tier = TIER_IDS.includes(tierRaw as TierId)
    ? (tierRaw as TierId)
    : undefined;

  try {
    const page = await listPacks({ limit, cursor, tier });
    return NextResponse.json(ResponseSchema.parse(page));
  } catch {
    // Store unavailable — return an empty page rather than breaking browse.
    return NextResponse.json({ items: [] });
  }
}
