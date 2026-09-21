import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { dreamExtractedSchema } from "@/lib/dream/types";
import { calculateDreamValue } from "@/lib/dream/scoring";
import { createFallbackDreamReading } from "@/lib/dream/fallback";
import { apiError } from "@/lib/http";

const inputSchema = z.object({
  dream: z.string().trim().min(1).max(1_500),
  turns: z.array(z.object({ question: z.string().trim().min(1).max(100), answer: z.string().trim().min(1).max(500) })).max(2),
  extracted: dreamExtractedSchema,
});

export async function POST(request: NextRequest) {
  let input: z.infer<typeof inputSchema>;
  try {
    input = inputSchema.parse(await request.json());
  } catch (error) {
    return apiError(error);
  }

  const value = calculateDreamValue(input.extracted);
  try {
    const reading = await getAIProvider().generateDreamReading({ ...input, scoreFactors: value.factors, amount: value.amount, verdict: value.verdict });
    return NextResponse.json({ reading, value });
  } catch (error) {
    console.error("Dream reading AI failed; returning a local fallback.", error);
    return NextResponse.json({ reading: createFallbackDreamReading({ ...input, verdict: value.verdict }), value, fallback: true });
  }
}
