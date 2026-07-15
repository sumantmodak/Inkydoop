import { NextRequest, NextResponse } from "next/server";
import { downloadImage } from "@/lib/store/blobStore";

export const dynamic = "force-dynamic";

// Streams a story image from Blob storage (§6.1 Step 4.5 / T6.5.4).
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (
    !path ||
    !/^[\w./-]+\.(webp|png|jpeg)$/.test(path) ||
    path.includes("..")
  ) {
    return new NextResponse("bad request", { status: 400 });
  }

  const data = await downloadImage(path);
  if (!data) return new NextResponse("not found", { status: 404 });

  const ext = path.slice(path.lastIndexOf(".") + 1);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": `image/${ext}`,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
