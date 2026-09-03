import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { parseAudioPath } from "@/lib/audio-path";
import { downloadAudio } from "@/lib/store/blobStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const path = parseAudioPath(request.nextUrl.searchParams.get("path"));
  if (!path) return new NextResponse("bad request", { status: 400 });

  const data = await downloadAudio(path);
  if (!data) return new NextResponse("not found", { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(data.length),
      "Cache-Control": "private, no-store",
    },
  });
}
