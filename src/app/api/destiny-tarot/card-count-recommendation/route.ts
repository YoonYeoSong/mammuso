import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { apiError } from "@/lib/http";
import { createProfileCardCountRecommendation, destinyReadingTypes, type DestinyReadingType } from "@/lib/destiny-tarot/profiles";

const inputSchema = z.object({
  readingType: z.enum(destinyReadingTypes),
  summary: z.string().trim().min(16).max(260),
  finalQuestion: z.string().trim().min(8).max(300),
});

/** Keeps the optional recommendation separate from the Phase 1 chat contract. */
export async function POST(request: NextRequest) {
  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(await request.json());
  } catch (error) {
    return apiError(error);
  }

  try {
    const recommendation = await getAIProvider().generateDestinyCardCountRecommendation({ ...input, readingType: input.readingType as DestinyReadingType });
    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("Destiny tarot card-count recommendation failed; returning profile guidance.", error);
    return NextResponse.json({ recommendation: createProfileCardCountRecommendation(input.readingType, input.finalQuestion), fallback: true });
  }
}
