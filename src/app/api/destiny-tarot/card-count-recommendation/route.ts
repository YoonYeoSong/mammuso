import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { apiError } from "@/lib/http";

const inputSchema = z.object({
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
    const recommendation = await getAIProvider().generateDestinyCardCountRecommendation(input);
    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("Destiny tarot card-count recommendation failed.", error);
    return NextResponse.json({ error: "RECOMMENDATION_UNAVAILABLE", message: "추천을 준비하지 못했어요." }, { status: 503 });
  }
}
