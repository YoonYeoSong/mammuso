import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { dreamExtractedSchema } from "@/lib/dream/types";
import { apiError } from "@/lib/http";

const inputSchema = z.object({
  dream: z.string().trim().min(1).max(1_500),
  turns: z.array(z.object({ question: z.string().trim().min(1).max(100), answer: z.string().trim().min(1).max(500) })).max(2),
  extracted: dreamExtractedSchema,
});

export async function POST(request: NextRequest) {
  try {
    const input = inputSchema.parse(await request.json());
    const reading = await getAIProvider().generateDreamReading(input);
    return NextResponse.json({ reading });
  } catch (error) {
    return apiError(error);
  }
}
