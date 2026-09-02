import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  getPackForModeration,
  listModerationPacks,
  moderatePack,
} from "@/lib/store/tableStore";
import { ModerationStatusSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const DecisionSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().max(1000).optional(),
});

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local"
  );
}

function allowed(request: NextRequest): NextResponse | null {
  if (!isAdminAuthorized(request)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  if (!rateLimit(`moderation:${clientIp(request)}`, 120, 60_000)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const blocked = allowed(request);
  if (blocked) return blocked;

  try {
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const item = await getPackForModeration(id);
      return item
        ? NextResponse.json({ item })
        : NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const status = ModerationStatusSchema.catch("pending").parse(
      request.nextUrl.searchParams.get("status"),
    );
    const items = await listModerationPacks(status);
    return NextResponse.json({ items });
  } catch (error) {
    console.error(`[moderation] read failed: ${String(error)}`);
    return NextResponse.json(
      { error: "moderation read failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const blocked = allowed(request);
  if (blocked) return blocked;

  let decision: z.infer<typeof DecisionSchema>;
  try {
    decision = DecisionSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    const status = decision.action === "approve" ? "approved" : "rejected";
    const updated = await moderatePack(decision.id, status, decision.note);
    if (!updated) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    console.log(
      JSON.stringify({
        event: "moderation",
        id: decision.id,
        status,
        ip: clientIp(request),
      }),
    );
    return NextResponse.json({ ok: true, id: decision.id, status });
  } catch (error) {
    console.error(`[moderation] update failed: ${String(error)}`);
    return NextResponse.json(
      { error: "moderation update failed" },
      { status: 500 },
    );
  }
}
