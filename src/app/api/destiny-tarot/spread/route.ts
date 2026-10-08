import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/http";
import { createProfileDestinySpread, destinyReadingTypes } from "@/lib/destiny-tarot/profiles";
import type { DestinyCardCount } from "@/lib/destiny-tarot/types";

const inputSchema = z.object({
  readingType: z.enum(destinyReadingTypes),
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
  // Stable profile families prevent prompt variability from changing the ritual.
  return NextResponse.json({ spread: createProfileDestinySpread(input.readingType, input.finalQuestion, cardCount), fallback: false });
}
