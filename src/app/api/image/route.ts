import { NextRequest, NextResponse } from "next/server";
import { downloadImage } from "@/lib/store/blobStore";
import { packIdFromImagePath, parseImagePath } from "@/lib/image-path";
import { isPackPublic } from "@/lib/store/tableStore";

export const dynamic = "force-dynamic";

// Streams a story image from Blob storage (§6.1 Step 4 / T6.5.4).
export async function GET(req: NextRequest) {
  const path = parseImagePath(req.nextUrl.searchParams.get("path"));
  if (!path) {
    return new NextResponse("bad request", { status: 400 });
  }

  const packId = packIdFromImagePath(path);
  if (packId !== "sample" && (!packId || !(await isPackPublic(packId)))) {
    return new NextResponse("not found", { status: 404 });
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
