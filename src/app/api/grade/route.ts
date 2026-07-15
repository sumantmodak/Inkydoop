import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { gradeAnswer } from "@/lib/grade/pipeline";
import { rateLimit } from "@/lib/rate-limit";
import { getServedPack } from "@/lib/store/read";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
  questionId: z.string(),
  answer: z.string().max(1000),
  date: z.string().optional(),
});

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

// Grades a single student answer via the multi-agent pipeline (§6.5).
export async function POST(req: NextRequest) {
  if (!rateLimit(`grade:${clientIp(req)}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { pack } = await getServedPack(body.date);
  const question = pack.questions.find((q) => q.id === body.questionId);
  if (!question) {
    return NextResponse.json({ error: "unknown question" }, { status: 404 });
  }

  try {
    const result = await gradeAnswer(
      question,
      body.answer,
      pack.story.paragraphs.join("\n\n"),
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
