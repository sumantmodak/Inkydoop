import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { parseImagePath } from "@/lib/image-path";
import { downloadImage } from "@/lib/store/blobStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const path = parseImagePath(request.nextUrl.searchParams.get("path"));
  if (!path) return new NextResponse("bad request", { status: 400 });

  const data = await downloadImage(path);
  if (!data) return new NextResponse("not found", { status: 404 });
  const ext = path.slice(path.lastIndexOf(".") + 1);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": `image/${ext}`,
      "Cache-Control": "private, no-store",
    },
  });
}
