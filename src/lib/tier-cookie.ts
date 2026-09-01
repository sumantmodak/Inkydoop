import { cookies } from "next/headers";
import { parseTier } from "@/lib/gen/tiers";
import type { TierId } from "@/lib/schemas";

/** Read the reader's chosen reading tier from the `tier` cookie (§2 / M9). */
export async function getTierCookie(): Promise<TierId> {
  return parseTier((await cookies()).get("tier")?.value);
}
