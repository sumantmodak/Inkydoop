import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function isAdminAuthorized(request: Request): boolean {
  const provided =
    request.headers.get("x-generate-key") ??
    new URL(request.url).searchParams.get("key") ??
    "";
  const expected = env.GENERATE_API_KEY;
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}
