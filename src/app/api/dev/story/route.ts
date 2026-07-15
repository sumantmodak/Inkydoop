import { NextRequest, NextResponse } from "next/server";
import { seedForDate } from "@/lib/gen/seed";
import { generateStory } from "@/lib/gen/story";

export const dynamic = "force-dynamic";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// Dev-only helper to inspect a freshly generated story. Not available in prod.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("not found", { status: 404 });
  }

  const date = req.nextUrl.searchParams.get("date") ?? todayUtc();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "invalid date, expected YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const seed = seedForDate(date);
  try {
    const story = await generateStory(seed);
    return NextResponse.json({ date, seed, story });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
