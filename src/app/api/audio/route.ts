import { NextRequest, NextResponse } from "next/server";
import { downloadAudio } from "@/lib/store/blobStore";
import { packIdFromAudioPath, parseAudioPath } from "@/lib/audio-path";
import { isPackPublic } from "@/lib/store/tableStore";

export const dynamic = "force-dynamic";

function parseRange(value: string | null, length: number) {
  const match = value?.match(/^bytes=(\d+)-(\d*)$/);
  if (!match) return null;
  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : length - 1;
  if (start >= length || requestedEnd < start) return null;
  return { start, end: Math.min(requestedEnd, length - 1) };
}

export async function GET(request: NextRequest) {
  const path = parseAudioPath(request.nextUrl.searchParams.get("path"));
  if (!path) return new NextResponse("bad request", { status: 400 });

  const packId = packIdFromAudioPath(path);
  if (!packId || !(await isPackPublic(packId))) {
    return new NextResponse("not found", { status: 404 });
  }
  const data = await downloadAudio(path);
  if (!data) return new NextResponse("not found", { status: 404 });

  const range = parseRange(request.headers.get("range"), data.length);
  const body = range ? data.subarray(range.start, range.end + 1) : data;
  return new NextResponse(new Uint8Array(body), {
    status: range ? 206 : 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": "inline; filename=story-narration.mp3",
      "Content-Length": String(body.length),
      "Accept-Ranges": "bytes",
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
      ...(range
        ? {
            "Content-Range": `bytes ${range.start}-${range.end}/${data.length}`,
          }
        : {}),
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
