import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { apiError } from "@/lib/http";

const inputSchema = z.object({
  dream: z.string().trim().min(1).max(1_500),
  turns: z.array(z.object({ question: z.string().trim().min(1).max(100), answer: z.string().trim().min(1).max(500) })).max(2),
});

export async function POST(request: NextRequest) {
  try {
    const input = inputSchema.parse(await request.json());
    const analysis = await getAIProvider().analyzeDream({ ...input, followupCount: input.turns.length });
    return NextResponse.json({ analysis });
  } catch (error) {
    return apiError(error);
  }
}
