import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { apiError } from "@/lib/http";
import { createFallbackDestinySpread, isValidDestinySpread, normalizeDestinySpread } from "@/lib/destiny-tarot/spread";
import type { DestinyCardCount } from "@/lib/destiny-tarot/types";

const inputSchema = z.object({
  concernSummary: z.string().trim().min(16).max(260),
  finalQuestion: z.string().trim().min(8).max(300),
  cardCount: z.union([z.literal(3), z.literal(5), z.literal(10)]),
});

/** AI defines reading meaning only; the user-facing deck remains client-owned. */
export async function POST(request: NextRequest) {
  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(await request.json());
  } catch (error) {
    return apiError(error);
  }

  const cardCount = input.cardCount as DestinyCardCount;
  try {
    const generated = await getAIProvider().generateDestinySpread(input);
    const fallback = !isValidDestinySpread(generated, cardCount);
    const spread = fallback ? createFallbackDestinySpread(cardCount) : normalizeDestinySpread(generated, cardCount);
    return NextResponse.json({ spread, fallback });
  } catch (error) {
    console.error("Destiny tarot spread generation failed; returning the stable fallback.", error);
    return NextResponse.json({ spread: createFallbackDestinySpread(cardCount), fallback: true });
  }
}
